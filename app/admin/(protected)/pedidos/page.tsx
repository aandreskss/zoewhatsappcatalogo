import Link from "next/link";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";
import { ORDER_STATUS_LABELS } from "@/lib/domain/order-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShoppingBag, Search, Package } from "lucide-react";

export const dynamic = "force-dynamic";

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Retiro",
  delivery: "Delivery",
  shipping: "Envío",
};

const DELIVERY_DOT: Record<string, string> = {
  pickup: "bg-violet-400",
  delivery: "bg-sky-400",
  shipping: "bg-amber-400",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  const { estado, q } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, total_usd, delivery_method, created_at, customer_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (estado) query = query.eq("status", estado);
  if (q) query = query.ilike("order_number", `%${q}%`);

  const { data: orders, error } = await query;

  const customerIds = Array.from(new Set((orders ?? []).map((o) => o.customer_id)));
  const { data: customers } =
    customerIds.length > 0
      ? await supabase.from("customers").select("id, first_name, last_name, phone").in("id", customerIds)
      : { data: [] };
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));

  function filterHref(params: { estado?: string; q?: string }) {
    const sp = new URLSearchParams();
    if (params.estado) sp.set("estado", params.estado);
    if (params.q) sp.set("q", params.q);
    const qs = sp.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#29252A]">Pedidos</h1>
          <p className="mt-0.5 text-sm text-[#29252A]/50">
            {(orders ?? []).length} resultado{(orders ?? []).length !== 1 ? "s" : ""}
            {estado ? ` · ${ORDER_STATUS_LABELS[estado as keyof typeof ORDER_STATUS_LABELS] ?? estado}` : ""}
            {q ? ` · "${q}"` : ""}
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <form method="get" className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#29252A]/35 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por número de pedido…"
            className="w-full rounded-xl border border-[#EBE4E1] bg-white py-2.5 pl-9 pr-4 text-sm placeholder:text-[#29252A]/35 focus:outline-none focus:ring-2 focus:ring-[#C9748A]/20 focus:border-[#C9748A]/40"
          />
          {estado && <input type="hidden" name="estado" value={estado} />}
        </form>

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={filterHref({ q })}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !estado
                ? "bg-[#29252A] text-white shadow-sm"
                : "border border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-[#29252A]/30 hover:text-[#29252A]"
            }`}
          >
            Todos
          </Link>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <Link
              key={value}
              href={filterHref({ estado: value, q })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                estado === value
                  ? "bg-[#C9748A] text-white shadow-sm"
                  : "border border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-[#C9748A]/30 hover:text-[#C9748A]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">Error al cargar pedidos: {error.message}</p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                # Pedido
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Entrega
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Total
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Fecha
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const customer = customerById.get(order.customer_id);
              const customerName = customer
                ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
                : "—";
              return (
                <tr
                  key={order.id}
                  className="border-t border-[#EBE4E1] transition-colors hover:bg-[#F4EFEc]/50"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-[#29252A]">
                      {order.order_number}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-[#29252A]">{customerName}</p>
                    {customer?.phone && (
                      <p className="text-xs text-[#29252A]/50">{customer.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${DELIVERY_DOT[order.delivery_method] ?? "bg-gray-300"}`}
                      />
                      <span className="text-[#29252A]/70">
                        {DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-[#29252A]">
                    {formatUsd(order.total_usd)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#29252A]/50">
                    {new Date(order.created_at).toLocaleDateString("es-VE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#C9748A] transition-colors hover:bg-[#C9748A]/10"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              );
            })}

            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
                      <ShoppingBag size={20} className="text-[#29252A]/25" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#29252A]">
                        {q || estado ? "Sin resultados" : "Aún no hay pedidos"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#29252A]/45">
                        {q || estado
                          ? "Prueba con otro filtro o término de búsqueda"
                          : "Los pedidos de los clientes aparecerán aquí"}
                      </p>
                    </div>
                    {(q || estado) && (
                      <Link
                        href="/admin/pedidos"
                        className="mt-1 rounded-lg border border-[#EBE4E1] px-3 py-1.5 text-xs font-medium text-[#29252A]/60 hover:bg-[#F4EFEc] transition-colors"
                      >
                        Ver todos
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
