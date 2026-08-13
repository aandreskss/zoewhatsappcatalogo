import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { PaymentMethodForm } from "@/components/admin/payment-method-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { togglePaymentMethodActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: methods } = await supabase
    .from("payment_methods")
    .select("id, name, instructions, active")
    .order("order");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Métodos de pago</h1>
      <PaymentMethodForm />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(methods ?? []).map((method) => (
          <li
            key={method.id}
            className="flex items-center justify-between gap-4 p-3 text-sm"
          >
            <div>
              <p className="font-medium">{method.name}</p>
              {method.instructions ? (
                <p className="text-[var(--color-muted-foreground)]">
                  {method.instructions}
                </p>
              ) : null}
            </div>
            <ToggleActive
              id={method.id}
              active={method.active}
              action={togglePaymentMethodActive}
            />
          </li>
        ))}
        {(methods ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay métodos de pago.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
