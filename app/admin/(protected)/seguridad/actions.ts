"use server";

import { requireAdminUser } from "@/lib/auth/session";
import { getMfaStatus } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";

/**
 * "Restablecer 2FA" (sección 23 del plan, complemento del enrolamiento
 * obligatorio) — para cuando el usuario perdió el dispositivo con su app
 * de autenticación. Requiere que la sesión ACTUAL ya esté en `aal2`
 * (Supabase lo exige para desenrolar un factor verificado): solo se puede
 * restablecer 2FA desde una sesión que ya demostró tener el dispositivo
 * antiguo, nunca como forma de saltárselo.
 */
export async function unenrollMfaFactor(): Promise<void> {
  await requireAdminUser();
  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);

  if (!mfa.hasVerifiedFactor || !mfa.verifiedFactorId) return;

  const { error } = await supabase.auth.mfa.unenroll({ factorId: mfa.verifiedFactorId });
  if (error) {
    throw new Error("No se pudo restablecer el 2FA. Intenta de nuevo.");
  }
}
