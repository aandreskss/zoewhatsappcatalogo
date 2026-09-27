import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getABTestConfig } from "@/lib/domain/ab-test";
import { getAdminSessionUser } from "@/lib/auth/session";
import { ABTestForm } from "@/components/admin/ab-test-form";

export const dynamic = "force-dynamic";

export default async function ABTestPage() {
  const user = await getAdminSessionUser();
  if (!user?.roles.some((r) => ["admin", "super_admin"].includes(r))) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">Sin acceso.</p>;
  }

  const supabase = createSupabaseServiceRoleClient();
  const config = await getABTestConfig(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Prueba A/B</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Divide el tráfico de la página de inicio entre el catálogo y una landing page.
          Los cambios se aplican en hasta 60 segundos.
        </p>
      </div>
      <ABTestForm current={config} />
    </div>
  );
}
