import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { DeleteItemButton } from "@/components/admin/delete-item-button";
import { createBrand, toggleBrandActive, deleteBrand } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarcasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, active")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Marcas</h1>
      <SimpleCreateForm
        action={createBrand}
        placeholder="Nombre de la marca"
        submitLabel="Crear"
      />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(brands ?? []).map((brand) => (
          <li key={brand.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{brand.name}</p>
              <p className="text-[var(--color-muted-foreground)]">/marca/{brand.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ToggleActive
                id={brand.id}
                active={brand.active}
                action={toggleBrandActive}
              />
              <DeleteItemButton id={brand.id} action={deleteBrand} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
