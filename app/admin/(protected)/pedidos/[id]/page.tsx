import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatUsd, formatVes } from "@/lib/domain/pricing";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { AddOrderNoteForm } from "@/components/admin/add-order-note-form";
import { orderStatusLabel } from "@/lib/domain/order-status";

export const dynamic = "force-dynamic";

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Retiro en tienda",
  delivery: "Delivery",
  shipping: "Envío nacional",
};

/**
 * Detalle de pedido (sección 18/57/58 del plan): datos del cliente,
 * entrega, items con snapshot (nunca se re-leen del catálogo actual —
 * el pedido conserva el precio y nombre tal como estaban al momento de
 * la compra), historial de estados, notas internas, y el mensaje de
 * WhatsApp que realmente se envió.
 */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, subtotal_usd, discount_usd, shipping_estimate_usd, total_usd, exchange_rate_used, exchange_rate_currency_pair, delivery_method, payment_notes, whatsapp_number_used, whatsapp_message_sent, whatsapp_opened_at, created_at, customer_id, store_id, delivery_address_id, payment_method_id, shipping_zone_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const [
    { data: customer },
    { data: items },
    { data: history },
    { data: notes },
    { data: store },
    { data: address },
    { data: paymentMethod },
    { data: shippingZone },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("first_name, last_name, phone, whatsapp_phone, email, city, state")
      .eq("id", order.customer_id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select(
        "id, product_name, sku, variant_label, unit_price_usd, discount_usd, quantity, subtotal_usd, image_url_snapshot",
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_status_history")
      .select("id, from_status, to_status, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("order_notes")
      .select("id, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    order.store_id
      ? supabase.from("stores").select("name").eq("id", order.store_id).maybeSingle()
      : { data: null },
    order.delivery_address_id
      ? supabase
          .from("customer_addresses")
          .select("state, city, municipality, address, reference")
          .eq("id", order.delivery_address_id)
          .maybeSingle()
      : { data: null },
    order.payment_method_id
      ? supabase
          .from("payment_methods")
          .select("name")
          .eq("id", order.payment_method_id)
          .maybeSingle()
      : { data: null },
    order.shipping_zone_id
      ? supabase
          .from("shipping_zones")
          .select("name, cost_usd")
          .eq("id", order.shipping_zone_id)
          .maybeSingle()
      : { data: null },
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/pedidos"
            className="text-sm text-[var(--color-muted-foreground)] underline"
          >
            ← Pedidos
          </Link>
          <h1 className="text-xl font-semibold">Pedido {order.order_number}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {new Date(order.created_at).toLocaleString("es-VE")}
          </p>
        </div>
        <div className="w-56">
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Artículos</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Variante</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Cant.</th>
                  <th className="pb-2 text-right">Precio</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)]">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-[var(--color-muted-foreground)]">
                      {item.variant_label}
                    </td>
                    <td className="py-2 text-[var(--color-muted-foreground)]">
                      {item.sku}
                    </td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2 text-right">{formatUsd(item.unit_price_usd)}</td>
                    <td className="py-2 text-right">{formatUsd(item.subtotal_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col items-end gap-1 text-sm">
              <div className="flex w-48 justify-between">
                <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
                <span>{formatUsd(order.subtotal_usd)}</span>
              </div>
              {order.discount_usd > 0 ? (
                <div className="flex w-48 justify-between">
                  <span className="text-[var(--color-muted-foreground)]">Descuento</span>
                  <span>-{formatUsd(order.discount_usd)}</span>
                </div>
              ) : null}
              {order.shipping_estimate_usd > 0 ? (
                <div className="flex w-48 justify-between">
                  <span className="text-[var(--color-muted-foreground)]">Envío</span>
                  <span>{formatUsd(order.shipping_estimate_usd)}</span>
                </div>
              ) : null}
              <div className="flex w-48 justify-between font-semibold">
                <span>Total</span>
                <span>{formatUsd(order.total_usd)}</span>
              </div>
              {order.exchange_rate_used ? (
                <div className="flex w-48 justify-between text-[var(--color-muted-foreground)]">
                  <span>≈ {order.exchange_rate_currency_pair}</span>
                  <span>{formatVes(order.total_usd * order.exchange_rate_used)}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Mensaje de WhatsApp enviado</h2>
            {order.whatsapp_message_sent ? (
              <>
                <pre className="rounded-[var(--radius-md)] bg-[var(--color-muted)] p-3 text-sm whitespace-pre-wrap">
                  {order.whatsapp_message_sent}
                </pre>
                <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                  Número: {order.whatsapp_number_used ?? "—"}
                  {order.whatsapp_opened_at
                    ? ` · Abierto ${new Date(order.whatsapp_opened_at).toLocaleString("es-VE")}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No se generó mensaje de WhatsApp para este pedido.
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Historial de estados</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {(history ?? []).map((entry) => (
                <li
                  key={entry.id}
                  className="border-t border-[var(--color-border)] pt-2 first:border-0 first:pt-0"
                >
                  <span className="font-medium">
                    {entry.from_status ? `${orderStatusLabel(entry.from_status)} → ` : ""}
                    {orderStatusLabel(entry.to_status)}
                  </span>
                  <span className="ml-2 text-[var(--color-muted-foreground)]">
                    {new Date(entry.created_at).toLocaleString("es-VE")}
                  </span>
                  {entry.note ? (
                    <p className="text-[var(--color-muted-foreground)]">{entry.note}</p>
                  ) : null}
                </li>
              ))}
              {(history ?? []).length === 0 ? (
                <li className="text-[var(--color-muted-foreground)]">
                  Sin historial todavía.
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Cliente</h2>
            <p className="text-sm">
              {customer
                ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
                : "—"}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {customer?.phone}
            </p>
            {customer?.email ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {customer.email}
              </p>
            ) : null}
            {customer?.city ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {customer.city}
                {customer.state ? `, ${customer.state}` : ""}
              </p>
            ) : null}
            {order.customer_id ? (
              <Link
                href={`/admin/clientes/${order.customer_id}`}
                className="mt-2 inline-block text-xs underline text-[var(--color-muted-foreground)]"
              >
                Ver perfil de cliente →
              </Link>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Entrega</h2>
            <p className="text-sm">
              {DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method}
            </p>
            {store ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Sucursal: {store.name}
              </p>
            ) : null}
            {address ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {address.address}
                {address.municipality ? `, ${address.municipality}` : ""}
                {address.city ? `, ${address.city}` : ""}
                {address.state ? `, ${address.state}` : ""}
                {address.reference ? ` (${address.reference})` : ""}
              </p>
            ) : null}
            {shippingZone ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Zona: {shippingZone.name} · {formatUsd(shippingZone.cost_usd)}
              </p>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Pago</h2>
            <p className="text-sm">{paymentMethod?.name ?? "—"}</p>
            {order.payment_notes ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {order.payment_notes}
              </p>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Notas internas</h2>
            <AddOrderNoteForm orderId={order.id} />
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {(notes ?? []).map((note) => (
                <li
                  key={note.id}
                  className="border-t border-[var(--color-border)] pt-2 first:border-0 first:pt-0"
                >
                  <p>{note.note}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(note.created_at).toLocaleString("es-VE")}
                  </p>
                </li>
              ))}
              {(notes ?? []).length === 0 ? (
                <li className="text-[var(--color-muted-foreground)]">
                  Sin notas todavía.
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
