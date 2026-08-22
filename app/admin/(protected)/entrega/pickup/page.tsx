import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { ToggleActive } from "@/components/admin/toggle-active";
import { toggleStorePickup, toggleStoreDelivery } from "./actions";

export const dynamic = "force-dynamic";

export default async function PickupConfigPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, pickup_enabled, delivery_enabled, active")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Retiro en tienda y delivery por sucursal</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Controla por sucursal si el cliente puede elegir &quot;Retiro en tienda&quot; o
        &quot;Delivery&quot; en el checkout (sección 16 del plan). Los costos de delivery
        por zona se configuran en{" "}
        <span className="font-medium">Entrega → Zonas de delivery</span>.
      </p>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left">
            <tr>
              <th className="p-3">Sucursal</th>
              <th className="p-3">Retiro en tienda</th>
              <th className="p-3">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((store) => (
              <tr key={store.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-medium">{store.name}</td>
                <td className="p-3">
                  <ToggleActive
                    id={store.id}
                    active={store.pickup_enabled}
                    action={toggleStorePickup}
                    labelOn="Habilitado"
                    labelOff="Deshabilitado"
                  />
                </td>
                <td className="p-3">
                  <ToggleActive
                    id={store.id}
                    active={store.delivery_enabled}
                    action={toggleStoreDelivery}
                    labelOn="Habilitado"
                    labelOff="Deshabilitado"
                  />
                </td>
              </tr>
            ))}
            {(stores ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-[var(--color-muted-foreground)]"
                >
                  No hay sucursales configuradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
