import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";
import { ShippingZoneForm } from "@/components/admin/shipping-zone-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { DeleteItemButton } from "@/components/admin/delete-item-button";
import { toggleShippingZoneActive, deleteShippingZone } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeliveryZonesPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("id, name, city, cost_usd, active")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Zonas y costos de delivery</h1>
      <ShippingZoneForm />

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left">
            <tr>
              <th className="p-3">Zona</th>
              <th className="p-3">Ciudad</th>
              <th className="p-3">Costo</th>
              <th className="p-3">Estado</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(zones ?? []).map((zone) => (
              <tr key={zone.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-medium">{zone.name}</td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {zone.city ?? "—"}
                </td>
                <td className="p-3">{formatUsd(zone.cost_usd)}</td>
                <td className="p-3">
                  <ToggleActive
                    id={zone.id}
                    active={zone.active}
                    action={toggleShippingZoneActive}
                  />
                </td>
                <td className="p-3">
                  <DeleteItemButton id={zone.id} action={deleteShippingZone} />
                </td>
              </tr>
            ))}
            {(zones ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-[var(--color-muted-foreground)]"
                >
                  No hay zonas de delivery configuradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
