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
import { MfaChallengeForm } from "@/components/admin/mfa-challenge-form";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Reto de 2FA (sección 23 del plan) — se llega aquí en un login nuevo
 * cuando el usuario ya tiene un factor TOTP verificado de antes, pero la
 * sesión actual todavía no pasó ese segundo factor (`aal1`).
 */
export default async function MfaChallengePage() {
  const user = await getAdminSessionUser();
  if (!user) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);
  if (!mfa.hasVerifiedFactor) redirect("/admin/mfa/enroll");
  if (mfa.isSessionVerified) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verificación en dos pasos</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu app de autenticación.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <MfaChallengeForm />
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
