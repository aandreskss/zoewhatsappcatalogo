import { getAdminSessionUser } from "@/lib/auth/session";
import { getMfaStatus, roleRequiresMfa } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaSecurityPanel } from "@/components/admin/mfa-security-panel";

export const dynamic = "force-dynamic";

/**
 * Pantalla de autoservicio de seguridad (sección 23 del plan) — estado de
 * 2FA y, si el usuario perdió su dispositivo, la forma de restablecerlo
 * (ver `unenrollMfaFactor`). Para roles que no exigen 2FA (inventory,
 * sales) sirve además como punto de entrada para activarlo de forma
 * voluntaria.
 */
export default async function SeguridadPage() {
  const user = await getAdminSessionUser();
  // `(protected)/layout.tsx` ya garantiza que hay sesión antes de llegar
  // aquí; este `if` es defensivo, no la comprobación real.
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Seguridad</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {roleRequiresMfa(user.roles)
            ? "Tu rol exige verificación en dos pasos para entrar al panel."
            : "La verificación en dos pasos es opcional para tu rol, pero puedes activarla."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificación en dos pasos (2FA)</CardTitle>
          <CardDescription>
            Basada en códigos TOTP (Google Authenticator, Authy, 1Password, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSecurityPanel
            hasVerifiedFactor={mfa.hasVerifiedFactor}
            isSessionVerified={mfa.isSessionVerified}
          />
        </CardContent>
      </Card>
    </div>
  );
}
