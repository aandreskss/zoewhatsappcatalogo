import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

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

  return <AdminShell user={user}>{children}</AdminShell>;
}
