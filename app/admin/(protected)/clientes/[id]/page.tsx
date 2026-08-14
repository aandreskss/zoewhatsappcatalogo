import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";
import { orderStatusLabel } from "@/lib/domain/order-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerSegmentBadge } from "@/components/admin/customer-segment-badge";
import { AddCustomerNoteForm } from "@/components/admin/add-customer-note-form";
import { CustomerTagsEditor } from "@/components/admin/customer-tags-editor";

export const dynamic = "force-dynamic";

const DELIVERY_LABEL: Record<string, string> = {
  pickup:   "Retiro en tienda",
  delivery: "Delivery",
  shipping: "Envío nacional",
};

export default async function AdminCustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select(
      "id, first_name, last_name, phone, whatsapp_phone, email, city, state, address, source, orders_count, total_spent_usd, first_order_at, last_order_at, created_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!customer) notFound();

  const [
    { data: orders },
    { data: addresses },
    { data: notes },
    { data: allTags },
    { data: assignedTags },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_usd, delivery_method, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_addresses")
      .select("id, label, state, city, municipality, address, reference, is_default")
      .eq("customer_id", id)
      .order("is_default", { ascending: false }),
    supabase
      .from("customer_notes")
      .select("id, note, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_tags")
      .select("id, name, color")
      .order("name"),
    supabase
      .from("customer_tag_assignments")
      .select("tag_id")
      .eq("customer_id", id),
  ]);

  const assignedTagIds = (assignedTags ?? []).map((a) => a.tag_id);
  const assignedTagDetails = (allTags ?? []).filter((t) => assignedTagIds.includes(t.id));

  const avgOrderUsd =
    customer.orders_count > 0
      ? customer.total_spent_usd / customer.orders_count
      : 0;

  // Datos de origen (UTMs)
  const source = customer.source as Record<string, string> | null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Cabecera ── */}
      <div>
        <Link
          href="/admin/clientes"
          className="text-sm text-[var(--color-muted-foreground)] underline"
        >
          ← Clientes
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            {customer.first_name} {customer.last_name ?? ""}
          </h1>
          <CustomerSegmentBadge customer={customer} />
          {assignedTagDetails.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}` }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
          <span>{customer.phone}</span>
          {customer.whatsapp_phone && customer.whatsapp_phone !== customer.phone ? (
            <span>WA: {customer.whatsapp_phone}</span>
          ) : null}
          {customer.email ? <span>{customer.email}</span> : null}
          {customer.city || customer.state ? (
            <span>{[customer.city, customer.state].filter(Boolean).join(", ")}</span>
          ) : null}
          <span>Cliente desde {new Date(customer.created_at).toLocaleDateString("es-VE")}</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Pedidos" value={String(customer.orders_count)} />
        <KpiCard label="Total gastado" value={formatUsd(customer.total_spent_usd)} />
        <KpiCard label="Ticket promedio" value={formatUsd(avgOrderUsd)} />
        <KpiCard
          label="Último pedido"
          value={
            customer.last_order_at
              ? new Date(customer.last_order_at).toLocaleDateString("es-VE")
              : "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Columna principal ── */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Historial de pedidos */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Historial de pedidos</h2>
            {(orders ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Este cliente no tiene pedidos todavía.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="pb-2"># Pedido</th>
                    <th className="pb-2">Entrega</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {(orders ?? []).map((order) => (
                    <tr key={order.id} className="border-t border-[var(--color-border)]">
                      <td className="py-2 font-medium">{order.order_number}</td>
                      <td className="py-2 text-[var(--color-muted-foreground)]">
                        {DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method}
                      </td>
                      <td className="py-2">{formatUsd(order.total_usd)}</td>
                      <td className="py-2">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-2 text-[var(--color-muted-foreground)]">
                        {new Date(order.created_at).toLocaleDateString("es-VE")}
                      </td>
                      <td className="py-2 text-right">
                        <Link href={`/admin/pedidos/${order.id}`} className="underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Notas del cliente */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Notas del cliente</h2>
            <AddCustomerNoteForm customerId={customer.id} />
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
                <li className="text-[var(--color-muted-foreground)]">Sin notas todavía.</li>
              ) : null}
            </ul>
          </section>
        </div>

        {/* ── Columna lateral ── */}
        <div className="flex flex-col gap-6">

          {/* Etiquetas */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Etiquetas</h2>
            <CustomerTagsEditor
              customerId={customer.id}
              allTags={allTags ?? []}
              assignedTagIds={assignedTagIds}
            />
          </section>

          {/* Direcciones */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Direcciones</h2>
            {(addresses ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sin direcciones registradas.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {(addresses ?? []).map((addr) => (
                  <li key={addr.id} className="border-t border-[var(--color-border)] pt-2 first:border-0 first:pt-0">
                    {addr.label ? (
                      <p className="font-medium">
                        {addr.label}
                        {addr.is_default ? " · Principal" : ""}
                      </p>
                    ) : null}
                    <p className="text-[var(--color-muted-foreground)]">
                      {[addr.address, addr.municipality, addr.city, addr.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {addr.reference ? (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Ref: {addr.reference}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Atribución / origen */}
          {source && Object.keys(source).length > 0 ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
              <h2 className="mb-3 font-medium">Origen de captación</h2>
              <dl className="flex flex-col gap-1 text-sm">
                {Object.entries(source).map(([key, val]) =>
                  val ? (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="text-[var(--color-muted-foreground)] capitalize">
                        {key.replace("utm_", "").replace("_", " ")}
                      </dt>
                      <dd className="font-medium">{val}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </section>
          ) : null}

          {/* Datos de contacto completos */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="mb-3 font-medium">Contacto</h2>
            <dl className="flex flex-col gap-1 text-sm">
              <Row label="Teléfono" value={customer.phone} />
              {customer.whatsapp_phone && customer.whatsapp_phone !== customer.phone ? (
                <Row label="WhatsApp" value={customer.whatsapp_phone} />
              ) : null}
              {customer.email ? <Row label="Email" value={customer.email} /> : null}
              {customer.address ? <Row label="Dirección" value={customer.address} /> : null}
              {customer.city ? <Row label="Ciudad" value={customer.city} /> : null}
              {customer.state ? <Row label="Estado" value={customer.state} /> : null}
              <Row
                label="1er pedido"
                value={
                  customer.first_order_at
                    ? new Date(customer.first_order_at).toLocaleDateString("es-VE")
                    : "—"
                }
              />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
