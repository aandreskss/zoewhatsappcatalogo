import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getSiteContent } from "@/lib/domain/site-content";
import { getAdminSessionUser } from "@/lib/auth/session";
import { ContentForm } from "@/components/admin/content-form";

export const dynamic = "force-dynamic";

export default async function ContenidoPage() {
  const user = await getAdminSessionUser();
  if (!user?.roles.some((r) => ["admin", "super_admin"].includes(r))) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">Sin acceso.</p>
    );
  }
  const supabase = createSupabaseServiceRoleClient();
  const content = await getSiteContent(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Contenido del sitio</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Edita los textos del hero, banner promo, datos de contacto y enlaces de navegación.
        </p>
      </div>
      <ContentForm current={content} />
    </div>
  );
}
