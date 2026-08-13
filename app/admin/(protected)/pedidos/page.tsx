import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  enviado_whatsapp: "Enviado a WhatsApp",
  contactado: "Contactado",
  confirmado: "Confirmado",
  esperando_pago: "Esperando pago",
  pagado: "Pagado",
  preparando: "Preparando",
  listo_para_entregar: "Listo para entregar",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Retiro en tienda",
  delivery: "Delivery",
  shipping: "Envío nacional",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  nuevo: "bg-[var(--color-muted)] text-[var(--color-foreground)]",
  cancelado: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  pagado: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  confirmado: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  entregado: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
};

/**
 * Lista de pedidos para el equipo de ventas (sección 18/57 del plan).
 * Solo lectura de datos ya validados en servidor — el cambio de estado
 * real vive en el detalle de cada pedido (`[id]/page.tsx`) para no
 * permitir mutaciones masivas accidentales desde una tabla.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, total_usd, delivery_method, created_at, customer_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (estado) {
    query = query.eq("status", estado);
  }

  const { data: orders, error } = await query;

  const customerIds = Array.from(
    new Set((orders ?? []).map((order) => order.customer_id)),
  );
  const { data: customers } =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name, phone")
          .in("id", customerIds)
      : { data: [] };
  const customerById = new Map(
    (customers ?? []).map((customer) => [customer.id, customer]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pedidos</h1>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/pedidos"
          className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1 ${!estado ? "bg-[var(--color-muted)] font-medium" : ""}`}
        >
          Todos
        </Link>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/pedidos?estado=${value}`}
            className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1 ${estado === value ? "bg-[var(--color-muted)] font-medium" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error)]">
          Error al cargar pedidos: {error.message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left">
            <tr>
              <th className="p-3"># Pedido</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Entrega</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const customer = customerById.get(order.customer_id);
              return (
                <tr key={order.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3 font-medium">{order.order_number}</td>
                  <td className="p-3">
                    {customer
                      ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
                      : "—"}
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {customer?.phone}
                    </div>
                  </td>
                  <td className="p-3">
                    {DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method}
                  </td>
                  <td className="p-3">{formatUsd(order.total_usd)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[order.status] ?? "bg-[var(--color-muted)]"}`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {new Date(order.created_at).toLocaleString("es-VE")}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/pedidos/${order.id}`} className="underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(orders ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-[var(--color-muted-foreground)]"
                >
                  Todavía no hay pedidos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
