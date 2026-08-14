import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { StoreCard } from "@/components/admin/store-card";
import { CreateStoreForm } from "@/components/admin/create-store-form";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const supabase = await createSupabaseServerClient();
  const { data: stores } = await supabase
    .from("stores")
    .select(
      "id, name, code, slug, address, city, state, phone, whatsapp, google_maps_url, lat, lng, pickup_enabled, delivery_enabled, active",
    )
    .order("name");

  const active   = (stores ?? []).filter((s) => s.active);
  const inactive = (stores ?? []).filter((s) => !s.active);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Cada sucursal aparece en el checkout (para retiro o delivery), en la
          sección <span className="font-medium">/tiendas</span> del sitio y en
          los datos estructurados de Google Maps.
        </p>
      </div>

      <CreateStoreForm />

      {(stores ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay sucursales. Crea la primera arriba.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Activas
              </p>
              {active.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          )}
          {inactive.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Inactivas
              </p>
              {inactive.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
