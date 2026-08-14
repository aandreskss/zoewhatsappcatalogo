import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import type { AppRole } from "@/lib/auth/session";

type DB = SupabaseClient<Database>;

/**
 * 2FA obligatorio para roles sensibles (sección 23 del plan). Usa el MFA
 * nativo de Supabase Auth (TOTP: Google Authenticator, Authy, 1Password,
 * etc.) en vez de reimplementar generación/verificación de códigos a mano
 * — igual que con el hashing de contraseñas, este proyecto no reinventa
 * primitivas de auth que la propia plataforma ya resuelve correctamente.
 *
 * Solo `super_admin` y `admin` lo requieren: son los roles con acceso a
 * datos sensibles (finanzas, usuarios, configuración de toda la tienda).
 * `inventory`/`sales` no lo exigen — el costo de fricción de un segundo
 * factor en cada login no se justifica para roles limitados a operar
 * pedidos/inventario del día a día.
 */
export function roleRequiresMfa(roles: AppRole[]): boolean {
  return roles.includes("super_admin") || roles.includes("admin");
}

export interface MfaStatus {
  /** Nivel de autenticación de la sesión actual ("aal2" = ya pasó el 2do factor). */
  currentLevel: string | null;
  /** Nivel que Supabase exige dado lo que el usuario tiene enrolado. */
  nextLevel: string | null;
  /** true si el usuario ya tiene un factor TOTP verificado (enrolado en algún momento). */
  hasVerifiedFactor: boolean;
  /** ID del primer factor TOTP verificado, si existe — usado para retar (challenge) en el login. */
  verifiedFactorId: string | null;
  /** true si la sesión ACTUAL ya completó el segundo factor. */
  isSessionVerified: boolean;
}

/**
 * Lee el estado de MFA del usuario autenticado en `supabase` (la sesión
 * atada a las cookies del request actual). Nunca lanza: un fallo al leer
 * el estado de MFA se trata como "no verificado todavía" (falla cerrado
 * hacia pedir el segundo factor, nunca hacia dejar pasar sin él).
 */
export async function getMfaStatus(supabase: DB): Promise<MfaStatus> {
  const [aalResult, factorsResult] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const verifiedTotp = (factorsResult.data?.totp ?? []).find(
    (f) => f.status === "verified",
  );

  return {
    currentLevel: aalResult.data?.currentLevel ?? null,
    nextLevel: aalResult.data?.nextLevel ?? null,
    hasVerifiedFactor: Boolean(verifiedTotp),
    verifiedFactorId: verifiedTotp?.id ?? null,
    isSessionVerified: aalResult.data?.currentLevel === "aal2",
  };
}
