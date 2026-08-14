import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";
import { CustomerSegmentBadge } from "@/components/admin/customer-segment-badge";
import {
  getCustomerSegment,
  CUSTOMER_SEGMENT_LABELS,
  type CustomerSegment,
} from "@/lib/domain/customers";
import { Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const SEGMENTS: CustomerSegment[] = [
  "vip",
  "frecuente",
  "regular",
  "nuevo",
  "en_riesgo",
  "inactivo",
  "sin_pedidos",
];

const SORT_OPTIONS = [
  { value: "", label: "Último pedido" },
  { value: "gasto", label: "Mayor gasto" },
  { value: "pedidos", label: "Más pedidos" },
];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; segmento?: string; orden?: string }>;
}) {
  const { q, segmento, orden } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const sortCol =
    orden === "gasto" ? "total_spent_usd" :
    orden === "pedidos" ? "orders_count" :
    "last_order_at";

  let query = supabase
    .from("customers")
    .select(
      "id, first_name, last_name, phone, email, city, state, orders_count, total_spent_usd, first_order_at, last_order_at, created_at",
    )
    .is("deleted_at", null)
    .order(sortCol, { ascending: false, nullsFirst: false })
    .limit(200);

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: customers, error } = await query;

  const filtered = (customers ?? []).filter((c) => {
    if (!segmento) return true;
    return getCustomerSegment(c) === segmento;
  });

  function buildUrl(params: { q?: string; segmento?: string; orden?: string }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.segmento) sp.set("segmento", params.segmento);
    if (params.orden) sp.set("orden", params.orden);
    const qs = sp.toString();
    return `/admin/clientes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#29252A]">Clientes</h1>
          <p className="mt-0.5 text-sm text-[#29252A]/50">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            {segmento ? ` · ${CUSTOMER_SEGMENT_LABELS[segmento as CustomerSegment] ?? segmento}` : ""}
            {q ? ` · "${q}"` : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#29252A]/35 pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono…"
          className="w-full rounded-xl border border-[#EBE4E1] bg-white py-2.5 pl-9 pr-4 text-sm placeholder:text-[#29252A]/35 focus:outline-none focus:ring-2 focus:ring-[#C9748A]/20 focus:border-[#C9748A]/40"
        />
        {segmento && <input type="hidden" name="segmento" value={segmento} />}
        {orden && <input type="hidden" name="orden" value={orden} />}
      </form>

      {/* Segmento + Ordenamiento */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={buildUrl({ q, orden })}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !segmento
                ? "bg-[#29252A] text-white shadow-sm"
                : "border border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-[#29252A]/30 hover:text-[#29252A]"
            }`}
          >
            Todos
          </Link>
          {SEGMENTS.map((seg) => (
            <Link
              key={seg}
              href={buildUrl({ q, segmento: seg, orden })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                segmento === seg
                  ? "bg-[#C9748A] text-white shadow-sm"
                  : "border border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-[#C9748A]/30 hover:text-[#C9748A]"
              }`}
            >
              {CUSTOMER_SEGMENT_LABELS[seg]}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#29252A]/40 mr-1">Ordenar por</span>
          {SORT_OPTIONS.map((opt, i) => {
            const active = (opt.value === "" && !orden) || orden === opt.value;
            return (
              <span key={opt.value} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#29252A]/20">·</span>}
                <Link
                  href={buildUrl({ q, segmento, orden: opt.value || undefined })}
                  className={`transition-colors ${
                    active
                      ? "font-semibold text-[#29252A]"
                      : "text-[#29252A]/45 hover:text-[#29252A]"
                  }`}
                >
                  {opt.label}
                </Link>
              </span>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">Error al cargar clientes: {error.message}</p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Cliente
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 sm:table-cell">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Pedidos
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 md:table-cell">
                Total gastado
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 lg:table-cell">
                Último pedido
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Segmento
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-t border-[#EBE4E1] transition-colors hover:bg-[#F4EFEc]/50"
              >
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[#29252A]">
                    {c.first_name} {c.last_name ?? ""}
                  </p>
                  <p className="text-xs text-[#29252A]/50">{c.phone}</p>
                  {c.email && (
                    <p className="text-xs text-[#29252A]/40">{c.email}</p>
                  )}
                </td>
                <td className="hidden px-4 py-3.5 text-sm text-[#29252A]/60 sm:table-cell">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-[#29252A]">{c.orders_count}</span>
                </td>
                <td className="hidden px-4 py-3.5 font-semibold text-[#29252A] md:table-cell">
                  {formatUsd(c.total_spent_usd)}
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-[#29252A]/50 lg:table-cell">
                  {c.last_order_at
                    ? new Date(c.last_order_at).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <CustomerSegmentBadge customer={c} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#C9748A] transition-colors hover:bg-[#C9748A]/10"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
                      <Users size={20} className="text-[#29252A]/25" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#29252A]">
                        {q || segmento ? "Sin resultados" : "Aún no hay clientes"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#29252A]/45">
                        {q || segmento
                          ? "Prueba con otro filtro o término de búsqueda"
                          : "Los clientes aparecerán aquí cuando hagan pedidos"}
                      </p>
                    </div>
                    {(q || segmento) && (
                      <Link
                        href="/admin/clientes"
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
