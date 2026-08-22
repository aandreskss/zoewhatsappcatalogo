import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";
import { getActiveTheme, DEFAULT_THEME_TOKENS } from "@/lib/domain/theme";
import { BrandingForm } from "@/components/admin/branding-form";

export const dynamic = "force-dynamic";

/**
 * Apariencia → Branding (sección 28 del plan: tokens editables "dentro de
 * límites seguros"). Solo Super Admin — ver `actions.ts`. Si no hay theme
 * guardado todavía, el formulario arranca con los valores placeholder de
 * `globals.css` (no implica que ya estén "activos": hasta el primer
 * guardado, el sitio sigue sirviendo los tokens por defecto del CSS).
 */
export default async function BrandingPage() {
  const user = await getAdminSessionUser();
  const supabase = createSupabaseServiceRoleClient();
  const theme = await getActiveTheme(supabase);

  if (!user?.roles.includes("super_admin")) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Apariencia y branding</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Solo Super Admin puede editar el branding del sitio.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Apariencia y branding</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Estos colores y el radio de bordes se aplican en todo el sitio público (y en
          este panel). No es un editor de CSS libre: solo se pueden cambiar estos valores
          dentro de los límites del design system.
        </p>
      </div>
      <BrandingForm current={theme ?? DEFAULT_THEME_TOKENS} />
    </div>
  );
}
