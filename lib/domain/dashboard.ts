import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import { FUNNEL_STEPS, type AnalyticsEventType } from "@/lib/analytics/event-types";

type DB = SupabaseClient<Database>;

export interface PeriodOrderKpis {
  orderCount: number;
  confirmedCount: number;
  totalUsd: number;
  previousOrderCount: number;
  previousTotalUsd: number;
}

/**
 * KPIs de pedidos hoy/semana (sección 19 del plan) con comparación contra
 * el período anterior equivalente (hoy vs. ayer, últimos 7 días vs. los 7
 * anteriores) — una comparación simple por ventana fija, no "calendario
 * fiscal"; suficiente para una tienda que recién arranca analítica.
 * "Confirmado" = cualquier estado desde `confirmado` en adelante en el
 * flujo (no `nuevo`/`enviado_whatsapp`/`cancelado`).
 */
const CONFIRMED_STATUSES = [
  "confirmado",
  "esperando_pago",
  "pagado",
  "preparando",
  "listo_para_entregar",
  "enviado",
  "entregado",
];

export async function getOrderKpis(supabase: DB, days: number): Promise<PeriodOrderKpis> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const { data: current } = await supabase
    .from("orders")
    .select("total_usd, status")
    .gte("created_at", periodStart.toISOString());

  const { data: previous } = await supabase
    .from("orders")
    .select("total_usd")
    .gte("created_at", previousStart.toISOString())
    .lt("created_at", periodStart.toISOString());

  const currentRows = current ?? [];
  const previousRows = previous ?? [];

  return {
    orderCount: currentRows.length,
    confirmedCount: currentRows.filter((o) => CONFIRMED_STATUSES.includes(o.status))
      .length,
    totalUsd: currentRows.reduce((sum, o) => sum + o.total_usd, 0),
    previousOrderCount: previousRows.length,
    previousTotalUsd: previousRows.reduce((sum, o) => sum + o.total_usd, 0),
  };
}

export interface FunnelStep {
  step: AnalyticsEventType;
  sessions: number;
  conversionFromPrevious: number | null;
}

/**
 * Embudo Visita→Producto→Carrito→Checkout→Enviado (sección 19/21 del
 * plan): sesiones únicas por paso dentro del período, con tasa de
 * conversión respecto al paso anterior. Se cuenta por `session_id`
 * distinto (no por evento) para que un usuario que ve 5 productos no
 * infle el paso "view_product" cinco veces.
 */
export async function getFunnelConversion(
  supabase: DB,
  days: number,
): Promise<FunnelStep[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("analytics_events")
    .select("event_type, session_id")
    .in("event_type", FUNNEL_STEPS)
    .gte("created_at", since);

  const sessionsByStep = new Map<AnalyticsEventType, Set<string>>();
  for (const step of FUNNEL_STEPS) sessionsByStep.set(step, new Set());
  for (const row of data ?? []) {
    sessionsByStep.get(row.event_type as AnalyticsEventType)?.add(row.session_id);
  }

  let previousCount: number | null = null;
  return FUNNEL_STEPS.map((step) => {
    const sessions = sessionsByStep.get(step)?.size ?? 0;
    const conversionFromPrevious =
      previousCount === null || previousCount === 0 ? null : sessions / previousCount;
    previousCount = sessions;
    return { step, sessions, conversionFromPrevious };
  });
}

export interface TopProductRow {
  entityId: string;
  count: number;
  productName: string | null;
}

async function topEntitiesByEvent(
  supabase: DB,
  eventType: AnalyticsEventType,
  days: number,
  limit: number,
): Promise<TopProductRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("analytics_events")
    .select("entity_id, metadata")
    .eq("event_type", eventType)
    .not("entity_id", "is", null)
    .gte("created_at", since)
    .limit(2000);

  const counts = new Map<string, { count: number; name: string | null }>();
  for (const row of data ?? []) {
    if (!row.entity_id) continue;
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const name = typeof meta.productName === "string" ? meta.productName : null;
    const entry = counts.get(row.entity_id) ?? { count: 0, name };
    entry.count += 1;
    if (!entry.name && name) entry.name = name;
    counts.set(row.entity_id, entry);
  }

  return [...counts.entries()]
    .map(([entityId, { count, name }]) => ({ entityId, count, productName: name }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Productos más vistos (`view_product`) — nombre viene del `metadata` del propio evento, sin join adicional (sección 19/21 del plan). */
export function getMostViewedProducts(supabase: DB, days: number, limit = 5) {
  return topEntitiesByEvent(supabase, "view_product", days, limit);
}

/** Variantes más agregadas al carrito (`add_to_cart`) — misma estrategia que arriba. */
export function getMostAddedToCart(supabase: DB, days: number, limit = 5) {
  return topEntitiesByEvent(supabase, "add_to_cart", days, limit);
}

export interface OutOfStockProduct {
  variantId: string;
  productName: string;
  sku: string;
  variantLabel: string;
}

/**
 * Variantes activas con disponibilidad total (todas las sucursales) en
 * cero o negativa. Se recorre `product_variants` y se suma
 * `variant_availability` en JS: el volumen esperado (catálogo de una
 * tienda de calzado, no un marketplace) hace innecesaria una vista
 * materializada solo para esto.
 */
export async function getOutOfStockVariants(
  supabase: DB,
  limit = 20,
): Promise<OutOfStockProduct[]> {
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, sku, product_id, products(name, status, deleted_at)")
    .eq("status", "active")
    .limit(500);

  const activeVariants = (variants ?? []).filter(
    (v) => v.products?.status === "published" && !v.products?.deleted_at,
  );
  if (activeVariants.length === 0) return [];

  const variantIds = activeVariants.map((v) => v.id);
  const { data: availability } = await supabase
    .from("variant_availability")
    .select("variant_id, available")
    .in("variant_id", variantIds);

  const availableByVariant = new Map<string, number>();
  for (const row of availability ?? []) {
    availableByVariant.set(
      row.variant_id,
      (availableByVariant.get(row.variant_id) ?? 0) + row.available,
    );
  }

  const { data: labelLinks } = await supabase
    .from("variant_option_values")
    .select("variant_id, product_option_values(value)")
    .in("variant_id", variantIds);
  const labelsByVariant = new Map<string, string[]>();
  for (const link of labelLinks ?? []) {
    const value = link.product_option_values?.value;
    if (!value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(value);
    labelsByVariant.set(link.variant_id, list);
  }

  return activeVariants
    .filter((v) => (availableByVariant.get(v.id) ?? 0) <= 0)
    .slice(0, limit)
    .map((v) => ({
      variantId: v.id,
      productName: v.products?.name ?? "—",
      sku: v.sku,
      variantLabel: (labelsByVariant.get(v.id) ?? []).join(" / ") || "—",
    }));
}

export interface TopStoreRow {
  storeId: string;
  storeName: string;
  orderCount: number;
}

/** Sucursal con más pedidos en el período (solo pedidos con retiro en tienda; delivery/envío no tienen `store_id` de origen fijo). */
export async function getTopStore(
  supabase: DB,
  days: number,
): Promise<TopStoreRow | null> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("store_id, stores(name)")
    .not("store_id", "is", null)
    .gte("created_at", since)
    .limit(2000);

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of data ?? []) {
    if (!row.store_id) continue;
    const entry = counts.get(row.store_id) ?? { name: row.stores?.name ?? "—", count: 0 };
    entry.count += 1;
    counts.set(row.store_id, entry);
  }

  const top = [...counts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  if (!top) return null;
  return { storeId: top[0], storeName: top[1].name, orderCount: top[1].count };
}

export interface TrafficSourceRow {
  source: string;
  sessionCount: number;
}

/** Fuente de tráfico principal (UTM source, o "directo" sin UTM) medida sobre eventos `page_view`/cualquier evento con atribución en el período. */
export async function getTopTrafficSources(
  supabase: DB,
  days: number,
  limit = 5,
): Promise<TrafficSourceRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("analytics_events")
    .select("session_id, utm_source")
    .gte("created_at", since)
    .limit(3000);

  const sessionsBySource = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const source = row.utm_source || "directo";
    const set = sessionsBySource.get(source) ?? new Set<string>();
    set.add(row.session_id);
    sessionsBySource.set(source, set);
  }

  return [...sessionsBySource.entries()]
    .map(([source, sessions]) => ({ source, sessionCount: sessions.size }))
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, limit);
}
