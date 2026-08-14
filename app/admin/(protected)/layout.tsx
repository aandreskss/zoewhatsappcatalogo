import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/auth/session";
import { getMfaStatus, roleRequiresMfa } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/ui/toast";

// Todo el dashboard depende de la sesión del usuario en cada request (auth,
// rol, sucursal) — nunca tiene sentido pre-renderizarlo como página
// estática en build time, y sin esto `next build` intenta ejecutar la
// consulta a Supabase sin credenciales reales.
export const dynamic = "force-dynamic";

/**
 * Capa 2 de autorización (server-side) para todo el dashboard. El
 * middleware (capa 1) ya bloquea a un usuario sin sesión antes de llegar
 * aquí, pero este layout es la comprobación real y no depende de que el
 * middleware no tenga bugs — ocultar un enlace en el frontend no es
 * seguridad.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  // 2FA obligatorio para roles sensibles (sección 23 del plan). Se exige
  // aquí, no en `signInWithPassword`, para que el enrolamiento/reto de MFA
  // sean sus propias pantallas fuera de `(protected)` (si vivieran dentro,
  // este mismo layout las bloquearía en un loop de redirects). Falla
  // cerrado: cualquier duda sobre si la sesión ya pasó el segundo factor
  // manda a la pantalla de reto, nunca deja pasar sin verificar.
  if (roleRequiresMfa(user.roles)) {
    const supabase = await createSupabaseServerClient();
    const mfa = await getMfaStatus(supabase);

    if (!mfa.hasVerifiedFactor) {
      redirect("/admin/mfa/enroll");
    }
    if (!mfa.isSessionVerified) {
      redirect("/admin/mfa/challenge");
    }
  }

  return (
    <ToastProvider>
      <AdminShell user={user}>{children}</AdminShell>
    </ToastProvider>
  );
}
