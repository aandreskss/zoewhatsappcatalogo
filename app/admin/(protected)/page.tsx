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
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Visitas",
  view_product: "Vio producto",
  add_to_cart: "Agregó al carrito",
  begin_checkout: "Inició checkout",
  checkout_completed: "Pedido enviado",
};

function delta(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return { text: current > 0 ? "Nuevo" : "Sin cambio", positive: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct >= 0 ? "+" : ""}${pct}% vs. período anterior`, positive: pct >= 0 };
}

function KpiCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {label}
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent + "18" }}
        >
          <Icon size={15} style={{ color: accent }} strokeWidth={2} />
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {value}
      </p>
      <p className={`text-xs font-medium ${positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
        {sub}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      {children}
    </div>
  );
}

function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      {children}
    </div>
  );
}

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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const name = user?.email?.split("@")[0] ?? "";

  return (
    <div className="flex flex-col gap-7">
      {/* Saludo */}
      <div>
        <p className="text-[var(--color-muted-foreground)] text-sm">{greeting},</p>
        <h1
          className="text-3xl text-[var(--color-foreground)] capitalize"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {name}
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Pedidos hoy"
          value={String(today.orderCount)}
          sub={delta(today.orderCount, today.previousOrderCount).text}
          positive={delta(today.orderCount, today.previousOrderCount).positive}
          icon={ShoppingBag}
          accent="#C9748A"
        />
        <KpiCard
          label="Monto hoy"
          value={formatUsd(today.totalUsd)}
          sub={delta(today.totalUsd, today.previousTotalUsd).text}
          positive={delta(today.totalUsd, today.previousTotalUsd).positive}
          icon={DollarSign}
          accent="#5A9E6F"
        />
        <KpiCard
          label="Pedidos 7 días"
          value={String(week.orderCount)}
          sub={delta(week.orderCount, week.previousOrderCount).text}
          positive={delta(week.orderCount, week.previousOrderCount).positive}
          icon={TrendingUp}
          accent="#7c3aed"
        />
        <KpiCard
          label="Monto 7 días"
          value={formatUsd(week.totalUsd)}
          sub={delta(week.totalUsd, week.previousTotalUsd).text}
          positive={delta(week.totalUsd, week.previousTotalUsd).positive}
          icon={DollarSign}
          accent="#0891b2"
        />
      </div>

      {/* Embudo */}
      <Section title="Embudo de conversión — últimos 7 días">
        <DataCard>
          {funnel.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sin datos todavía.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {funnel.map((row, i) => {
                const pct = row.conversionFromPrevious !== null
                  ? Math.round(row.conversionFromPrevious * 100)
                  : 100;
                const maxSessions = funnel[0]?.sessions ?? 1;
                const barPct = Math.round((row.sessions / maxSessions) * 100);
                return (
                  <div key={row.step} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-[var(--color-foreground)]">
                      {FUNNEL_LABELS[row.step] ?? row.step}
                    </span>
                    <div className="relative flex-1 h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#C9748A]"
                        style={{ width: `${barPct}%`, opacity: 1 - i * 0.12 }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-[var(--color-muted-foreground)]">
                      {row.sessions} sesiones
                    </span>
                    {row.conversionFromPrevious !== null && (
                      <span className={`w-12 shrink-0 text-right text-xs font-medium ${pct >= 50 ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DataCard>
      </Section>

      {/* Productos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Productos más vistos">
          <DataCard>
            {mostViewed.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sin datos todavía.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {mostViewed.map((row) => (
                  <li key={row.entityId} className="flex items-center justify-between py-2">
                    <span className="truncate">{row.productName ?? row.entityId}</span>
                    <span className="ml-4 shrink-0 font-medium text-[var(--color-muted-foreground)]">
                      {row.count} vistas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>
        </Section>

        <Section title="Más agregados al carrito">
          <DataCard>
            {mostAdded.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sin datos todavía.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {mostAdded.map((row) => (
                  <li key={row.entityId} className="flex items-center justify-between py-2">
                    <span className="truncate">{row.productName ?? row.entityId}</span>
                    <span className="ml-4 shrink-0 font-medium text-[var(--color-muted-foreground)]">
                      {row.count} veces
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>
        </Section>
      </div>

      {/* Sin stock + Tráfico */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Sin stock">
          <DataCard>
            {outOfStock.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                Todo el catálogo tiene stock.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {outOfStock.map((row) => (
                  <li key={row.variantId} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={13} className="shrink-0 text-[var(--color-warning)]" />
                      {row.productName} — {row.variantLabel}
                    </span>
                    <span className="ml-4 shrink-0 text-xs text-[var(--color-muted-foreground)]">
                      {row.sku}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>
        </Section>

        <Section title="Tráfico y sucursal líder">
          <DataCard>
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Sucursal líder (7 días)</p>
                <p className="mt-1 font-medium">
                  {topStore
                    ? `${topStore.storeName} · ${topStore.orderCount} pedidos`
                    : "Sin datos todavía"}
                </p>
              </div>
              {topSources.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Fuentes de tráfico</p>
                  <ul className="mt-1 divide-y divide-[var(--color-border)]">
                    {topSources.map((row) => (
                      <li key={row.source} className="flex items-center justify-between py-1.5">
                        <span>{row.source}</span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {row.sessionCount} sesiones
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DataCard>
        </Section>
      </div>
    </div>
  );
}
