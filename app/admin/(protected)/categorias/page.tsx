import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { createCategory, toggleCategoryActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, active")
    .order("order");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Categorías</h1>
      <SimpleCreateForm
        action={createCategory}
        placeholder="Nombre de la categoría"
        submitLabel="Crear"
      />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(categories ?? []).map((category) => (
          <li key={category.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-[var(--color-muted-foreground)]">
                /categoria/{category.slug}
              </p>
            </div>
            <ToggleActive
              id={category.id}
              active={category.active}
              action={toggleCategoryActive}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
