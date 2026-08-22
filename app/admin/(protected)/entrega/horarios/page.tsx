import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { StoreHoursRow } from "@/components/admin/store-hours-row";

export const dynamic = "force-dynamic";

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Horarios por sucursal (sección 22 del plan — NAP consistente para SEO
 * local: `/tiendas/[slug]` muestra exactamente estos horarios en su
 * `LocalBusiness` schema). Si una sucursal aún no tiene los 7 días
 * inicializados, se muestran con valores por defecto sin fila creada
 * todavía — el primer "Guardar" la crea (`upsert`).
 */
export default async function StoreHoursPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("active", true)
    .order("name");
  const { data: hours } = await supabase
    .from("store_hours")
    .select("store_id, day_of_week, opens_at, closes_at, closed");

  const hoursByStore = new Map<
    string,
    Map<number, { opens_at: string | null; closes_at: string | null; closed: boolean }>
  >();
  for (const row of hours ?? []) {
    const byDay = hoursByStore.get(row.store_id) ?? new Map();
    byDay.set(row.day_of_week, row);
    hoursByStore.set(row.store_id, byDay);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Horarios por sucursal</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Estos horarios se muestran en la landing pública de cada sucursal (
        <span className="font-medium">/tiendas</span>) y en su ficha de datos
        estructurados.
      </p>

      {(stores ?? []).map((store) => {
        const byDay = hoursByStore.get(store.id);
        return (
          <div
            key={store.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
          >
            <h2 className="mb-3 font-medium">{store.name}</h2>
            <div className="flex flex-col">
              {DAY_LABELS.map((label, dayOfWeek) => {
                const row = byDay?.get(dayOfWeek);
                return (
                  <StoreHoursRow
                    key={dayOfWeek}
                    storeId={store.id}
                    dayOfWeek={dayOfWeek}
                    dayLabel={label}
                    opensAt={row?.opens_at ?? null}
                    closesAt={row?.closes_at ?? null}
                    closed={row?.closed ?? dayOfWeek === 0}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {(stores ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No hay sucursales activas.
        </p>
      ) : null}
    </div>
  );
}
