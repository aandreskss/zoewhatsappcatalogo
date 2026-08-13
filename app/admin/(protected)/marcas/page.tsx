import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { createBrand, toggleBrandActive } from "./actions";

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
          <li key={brand.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{brand.name}</p>
              <p className="text-[var(--color-muted-foreground)]">/marca/{brand.slug}</p>
            </div>
            <ToggleActive
              id={brand.id}
              active={brand.active}
              action={toggleBrandActive}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
