import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { ShippingCarrierForm } from "@/components/admin/shipping-carrier-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { DeleteItemButton } from "@/components/admin/delete-item-button";
import { toggleShippingCarrierActive, deleteShippingCarrier } from "./actions";

export const dynamic = "force-dynamic";

export default async function ShippingCarriersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: carriers } = await supabase
    .from("shipping_carriers")
    .select("id, name, notes, active")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Empresas de envío nacional</h1>
      <ShippingCarrierForm />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(carriers ?? []).map((carrier) => (
          <li
            key={carrier.id}
            className="flex items-center justify-between gap-4 p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{carrier.name}</p>
              {carrier.notes ? (
                <p className="text-[var(--color-muted-foreground)]">{carrier.notes}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ToggleActive
                id={carrier.id}
                active={carrier.active}
                action={toggleShippingCarrierActive}
              />
              <DeleteItemButton id={carrier.id} action={deleteShippingCarrier} />
            </div>
          </li>
        ))}
        {(carriers ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay empresas de envío configuradas.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
