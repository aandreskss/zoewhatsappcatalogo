import { notFound } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { buildWhatsAppLink } from "@/lib/domain/whatsapp-shared";
import { formatUsd } from "@/lib/domain/pricing";
import { WhatsAppCta } from "@/components/checkout/whatsapp-cta";

export const dynamic = "force-dynamic";

/**
 * Confirmación post-registro de pedido (sección 5/17/29 del plan).
 *
 * SIEMPRE se consulta con Service Role Key validando `public_access_token`
 * en código — nunca solo por `order_number` (predecible, nunca es una
 * credencial válida por sí sola — regla permanente + sección 23/48).
 */
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;
  if (!orderNumber || !token) notFound();

  const supabase = createSupabaseServiceRoleClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, public_access_token, total_usd, whatsapp_number_used, whatsapp_message_sent, delivery_method, status",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order || order.public_access_token !== token) notFound();

  const whatsappLink =
    order.whatsapp_number_used && order.whatsapp_message_sent
      ? buildWhatsAppLink(order.whatsapp_number_used, order.whatsapp_message_sent)
      : null;

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">¡Pedido registrado!</h1>
      <p className="text-[var(--color-muted-foreground)]">
        Tu pedido{" "}
        <span className="font-medium text-[var(--color-foreground)]">
          #{order.order_number}
        </span>{" "}
        quedó guardado por {formatUsd(order.total_usd)}. Para completarlo, envíanoslo por
        WhatsApp — nuestro equipo confirmará disponibilidad y te ayudará con el pago.
      </p>

      {whatsappLink ? (
        <WhatsAppCta
          whatsappLink={whatsappLink}
          message={order.whatsapp_message_sent ?? ""}
          phone={order.whatsapp_number_used ?? ""}
        />
      ) : (
        <p className="text-sm text-[var(--color-error)]">
          No pudimos generar el enlace de WhatsApp. Contáctanos directamente indicando tu
          número de pedido.
        </p>
      )}
    </main>
  );
}
