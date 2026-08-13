import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  getOrderKpis,
  getFunnelConversion,
  getMostViewedProducts,
  getMostAddedToCart,
  getOutOfStockVariants,
  getTopStore,
  getTopTrafficSources,
} from "@/lib/domain/dashboard";
import { formatUsd } from "@/lib/domain/pricing";

export const dynamic = "force-dynamic";

const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Visitas",
  view_product: "Vio producto",
  add_to_cart: "Agregó al carrito",
  begin_checkout: "Inició checkout",
  checkout_completed: "Pedido enviado",
};

function deltaLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "nuevo" : "sin cambio";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs. período anterior`;
}

/**
 * Dashboard ejecutivo (sección 19/21 del plan): KPIs de hoy y últimos 7
 * días con comparación contra el período anterior, embudo de conversión,
 * productos top, sin stock, sucursal líder y fuente de tráfico principal.
 * Todo agregado en `lib/domain/dashboard.ts` sobre datos reales de
 * `orders`/`analytics_events` — sin números de ejemplo ni placeholders.
 */
export default async function AdminDashboardPage() {
  const user = await getAdminSessionUser();
  const supabase = await createSupabaseServerClient();

  const [today, week, funnel, mostViewed, mostAdded, outOfStock, topStore, topSources] =
    await Promise.all([
      getOrderKpis(supabase, 1),
      getOrderKpis(supabase, 7),
      getFunnelConversion(supabase, 7),
      getMostViewedProducts(supabase, 7),
      getMostAddedToCart(supabase, 7),
      getOutOfStockVariants(supabase, 10),
      getTopStore(supabase, 7),
      getTopTrafficSources(supabase, 7),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sesión:{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {user?.email}
          </span>
          {user && user.roles.length > 0 ? ` · ${user.roles.join(", ")}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">
              Pedidos hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{today.orderCount}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {deltaLabel(today.orderCount, today.previousOrderCount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">
              Monto hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatUsd(today.totalUsd)}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {deltaLabel(today.totalUsd, today.previousTotalUsd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">
              Pedidos (7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{week.orderCount}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {deltaLabel(week.orderCount, week.previousOrderCount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">
              Monto (7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatUsd(week.totalUsd)}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {deltaLabel(week.totalUsd, week.previousTotalUsd)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Embudo de conversión (últimos 7 días)</CardTitle>
          <CardDescription>
            Sesiones únicas por paso, con tasa respecto al paso anterior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
            {funnel.map((row) => (
              <li key={row.step} className="flex items-center justify-between py-2">
                <span>{FUNNEL_LABELS[row.step] ?? row.step}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {row.sessions}
                  {row.conversionFromPrevious !== null
                    ? ` (${Math.round(row.conversionFromPrevious * 100)}%)`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos más vistos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
              {mostViewed.map((row) => (
                <li key={row.entityId} className="flex items-center justify-between py-2">
                  <span>{row.productName ?? row.entityId}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {row.count} vistas
                  </span>
                </li>
              ))}
              {mostViewed.length === 0 ? (
                <li className="py-2 text-[var(--color-muted-foreground)]">
                  Sin datos todavía.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Más agregados al carrito</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
              {mostAdded.map((row) => (
                <li key={row.entityId} className="flex items-center justify-between py-2">
                  <span>{row.productName ?? row.entityId}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {row.count} veces
                  </span>
                </li>
              ))}
              {mostAdded.length === 0 ? (
                <li className="py-2 text-[var(--color-muted-foreground)]">
                  Sin datos todavía.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sin stock</CardTitle>
            <CardDescription>
              Variantes activas con disponibilidad en cero en todas las sucursales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
              {outOfStock.map((row) => (
                <li
                  key={row.variantId}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    {row.productName} — {row.variantLabel}
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">{row.sku}</span>
                </li>
              ))}
              {outOfStock.length === 0 ? (
                <li className="py-2 text-[var(--color-muted-foreground)]">
                  Todo el catálogo tiene stock.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sucursal líder y tráfico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              Sucursal con más pedidos (7 días):{" "}
              <span className="font-medium">
                {topStore
                  ? `${topStore.storeName} (${topStore.orderCount})`
                  : "sin pedidos con retiro todavía"}
              </span>
            </p>
            <div>
              <p className="mb-1 font-medium">Fuentes de tráfico principales</p>
              <ul className="flex flex-col divide-y divide-[var(--color-border)]">
                {topSources.map((row) => (
                  <li
                    key={row.source}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span>{row.source}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {row.sessionCount} sesiones
                    </span>
                  </li>
                ))}
                {topSources.length === 0 ? (
                  <li className="py-1.5 text-[var(--color-muted-foreground)]">
                    Sin datos todavía.
                  </li>
                ) : null}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
