import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { PaymentMethodForm, PaymentMethodCard } from "@/components/admin/payment-method-form";

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: methods } = await supabase
    .from("payment_methods")
    .select("id, name, instructions, active")
    .order("order");

  const active = (methods ?? []).filter((m) => m.active);
  const inactive = (methods ?? []).filter((m) => !m.active);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Los métodos activos aparecen en el checkout y en el mensaje de WhatsApp del pedido.
        </p>
      </div>

      <PaymentMethodForm />

      {(methods ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay métodos de pago. Agrega el primero arriba.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Activos
              </p>
              <ul className="flex flex-col gap-2">
                {active.map((m) => (
                  <PaymentMethodCard key={m.id} method={m} />
                ))}
              </ul>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Inactivos
              </p>
              <ul className="flex flex-col gap-2">
                {inactive.map((m) => (
                  <PaymentMethodCard key={m.id} method={m} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
