import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: stores }, { data: zones }, { data: paymentMethods }] = await Promise.all(
    [
      supabase
        .from("stores")
        .select("id, name, address")
        .eq("active", true)
        .eq("pickup_enabled", true)
        .order("name"),
      supabase
        .from("shipping_zones")
        .select("id, name, cost_usd")
        .eq("active", true)
        .order("name"),
      supabase
        .from("payment_methods")
        .select("id, name, instructions")
        .eq("active", true)
        .order("order"),
    ],
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Envía tu pedido a Zoe por WhatsApp</h1>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        No pagarás en esta página. Al continuar, se abrirá WhatsApp con los productos que elegiste.
        Nuestro equipo confirmará disponibilidad, entrega y forma de pago contigo.
      </p>
      <CheckoutForm
        stores={stores ?? []}
        shippingZones={zones ?? []}
        paymentMethods={paymentMethods ?? []}
      />
    </main>
  );
}
