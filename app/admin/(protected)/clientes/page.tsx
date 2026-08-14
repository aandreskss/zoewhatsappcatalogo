import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatUsd } from "@/lib/domain/pricing";
import { CustomerSegmentBadge } from "@/components/admin/customer-segment-badge";
import {
  getCustomerSegment,
  CUSTOMER_SEGMENT_LABELS,
  type CustomerSegment,
} from "@/lib/domain/customers";

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
    // búsqueda por nombre o teléfono (ilike)
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: customers, error } = await query;

  // Filtrado de segmento se hace en JS porque el segmento se calcula en código
  const filtered = (customers ?? []).filter((c) => {
    if (!segmento) return true;
    return getCustomerSegment(c) === segmento;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Búsqueda */}
      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono…"
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        {segmento ? <input type="hidden" name="segmento" value={segmento} /> : null}
        {orden ? <input type="hidden" name="orden" value={orden} /> : null}
        <button
          type="submit"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Buscar
        </button>
      </form>

      {/* Filtros de segmento */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={buildUrl({ q, orden })}
          className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1 ${!segmento ? "bg-[var(--color-muted)] font-medium" : ""}`}
        >
          Todos
        </Link>
        {SEGMENTS.map((seg) => (
          <Link
            key={seg}
            href={buildUrl({ q, segmento: seg, orden })}
            className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1 ${segmento === seg ? "bg-[var(--color-muted)] font-medium" : ""}`}
          >
            {CUSTOMER_SEGMENT_LABELS[seg]}
          </Link>
        ))}
      </div>

      {/* Ordenamiento */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <span>Ordenar:</span>
        <Link href={buildUrl({ q, segmento })} className={!orden || orden === "ultimo" ? "font-medium text-[var(--color-foreground)]" : "underline"}>
          Último pedido
        </Link>
        <span>·</span>
        <Link href={buildUrl({ q, segmento, orden: "gasto" })} className={orden === "gasto" ? "font-medium text-[var(--color-foreground)]" : "underline"}>
          Mayor gasto
        </Link>
        <span>·</span>
        <Link href={buildUrl({ q, segmento, orden: "pedidos" })} className={orden === "pedidos" ? "font-medium text-[var(--color-foreground)]" : "underline"}>
          Más pedidos
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error)]">Error al cargar clientes: {error.message}</p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Ubicación</th>
              <th className="p-3">Pedidos</th>
              <th className="p-3">Total gastado</th>
              <th className="p-3">Último pedido</th>
              <th className="p-3">Segmento</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-[var(--color-border)]">
                <td className="p-3">
                  <p className="font-medium">
                    {c.first_name} {c.last_name ?? ""}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{c.phone}</p>
                  {c.email ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">{c.email}</p>
                  ) : null}
                </td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="p-3">{c.orders_count}</td>
                <td className="p-3">{formatUsd(c.total_spent_usd)}</td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {c.last_order_at
                    ? new Date(c.last_order_at).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td className="p-3">
                  <CustomerSegmentBadge customer={c} />
                </td>
                <td className="p-3 text-right">
                  <Link href={`/admin/clientes/${c.id}`} className="underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--color-muted-foreground)]">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildUrl(params: { q?: string; segmento?: string; orden?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.segmento) sp.set("segmento", params.segmento);
  if (params.orden) sp.set("orden", params.orden);
  const qs = sp.toString();
  return `/admin/clientes${qs ? `?${qs}` : ""}`;
}
