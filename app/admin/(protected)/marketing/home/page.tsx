import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { HomeSectionForm } from "@/components/admin/home-section-form";
import { HomeSectionRow } from "@/components/admin/home-section-row";

export const dynamic = "force-dynamic";

/**
 * Constructor de bloques del Home (sección 19/28 del plan). Ver el
 * comentario en `lib/domain/home.ts` sobre el alcance elegido: config
 * como JSON estructurado por tipo, en vez de un editor visual por campo
 * para cada uno de los 12 tipos de bloque.
 */
export default async function HomeSectionsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: sections } = await supabase
    .from("home_sections")
    .select("id, type, title, active, config")
    .order("order");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Bloques del Home</h1>
      <HomeSectionForm />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(sections ?? []).map((section) => (
          <HomeSectionRow
            key={section.id}
            id={section.id}
            type={section.type}
            title={section.title}
            active={section.active}
            config={section.config}
          />
        ))}
        {(sections ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            El Home todavía no tiene bloques configurados.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
