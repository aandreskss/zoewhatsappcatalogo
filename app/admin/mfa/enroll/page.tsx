import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/auth/session";
import { getMfaStatus } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaEnrollForm } from "@/components/admin/mfa-enroll-form";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Depende de la sesión del usuario en cada request, igual que el resto
// del admin — nunca se pre-renderiza en build time.
export const dynamic = "force-dynamic";

/**
 * Enrolamiento de 2FA (sección 23 del plan). Vive fuera de `(protected)`
 * a propósito: ese layout redirige aquí a los roles que exigen 2FA sin
 * un factor verificado, así que si esta pantalla estuviera dentro de
 * `(protected)` se generaría un loop de redirects.
 */
export default async function MfaEnrollPage() {
  const user = await getAdminSessionUser();
  if (!user) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);
  if (mfa.hasVerifiedFactor) {
    redirect(mfa.isSessionVerified ? "/admin" : "/admin/mfa/challenge");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activa la verificación en dos pasos</CardTitle>
          <CardDescription>
            Escanea el código QR con Google Authenticator, Authy, 1Password u otra app
            compatible con TOTP, o ingresa la clave manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <MfaEnrollForm />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Cancelar y salir
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
