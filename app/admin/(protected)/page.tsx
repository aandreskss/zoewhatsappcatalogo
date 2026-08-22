import { getAdminSessionUser } from "@/lib/auth/session";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
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
  TrendingDown,
  AlertTriangle,
  BarChart2,
  Store,
  Eye,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Visitas",
  view_product: "Vio producto",
  add_to_cart: "Agregó al carrito",
  begin_checkout: "Inició checkout",
  checkout_completed: "Pedido enviado",
};

function delta(current: number, previous: number) {
  if (previous === 0) return { text: current > 0 ? "Nuevo" : "Sin cambio", positive: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct >= 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
}

function KpiCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: React.ElementType;
  accent: string;
  href?: string;
}) {
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  const content = (
    <div className="group flex flex-col gap-4 rounded-2xl border border-[#EBE4E1] bg-white p-5 shadow-[0_1px_3px_rgba(41,37,42,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(41,37,42,0.1)]">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">{label}</p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent + "18" }}
        >
          <Icon size={15} style={{ color: accent }} strokeWidth={2.2} />
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-[#29252A]">{value}</p>
        <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-[#C9748A]"}`}>
          <TrendIcon size={11} strokeWidth={2.5} />
          <span>{sub} vs. período anterior</span>
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-sm font-bold text-[#29252A]">{title}</h2>
      {subtitle && <span className="text-xs text-[#29252A]/40">{subtitle}</span>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function EmptyCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4EFEc]">
        <Icon size={18} className="text-[#29252A]/25" />
      </div>
      <p className="text-xs text-[#29252A]/40">{text}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const user = await getAdminSessionUser();
  const supabase = createSupabaseServiceRoleClient();

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

  const todayOrders = delta(today.orderCount, today.previousOrderCount);
  const todayRevenue = delta(today.totalUsd, today.previousTotalUsd);
  const weekOrders = delta(week.orderCount, week.previousOrderCount);
  const weekRevenue = delta(week.totalUsd, week.previousTotalUsd);

  return (
    <div className="flex flex-col gap-8">
      {/* Saludo */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-[#29252A]/50">{greeting},</p>
          <h1
            className="text-3xl font-normal text-[#29252A] capitalize"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {name}
          </h1>
        </div>
        <p className="hidden text-xs text-[#29252A]/30 sm:block">
          {now.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Pedidos hoy" value={String(today.orderCount)} sub={todayOrders.text} positive={todayOrders.positive} icon={ShoppingBag} accent="#C9748A" href="/admin/pedidos" />
        <KpiCard label="Monto hoy" value={formatUsd(today.totalUsd)} sub={todayRevenue.text} positive={todayRevenue.positive} icon={DollarSign} accent="#5A9E6F" />
        <KpiCard label="Pedidos 7 días" value={String(week.orderCount)} sub={weekOrders.text} positive={weekOrders.positive} icon={TrendingUp} accent="#7c3aed" href="/admin/pedidos" />
        <KpiCard label="Monto 7 días" value={formatUsd(week.totalUsd)} sub={weekRevenue.text} positive={weekRevenue.positive} icon={DollarSign} accent="#0891b2" />
      </div>

      {/* Embudo */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="Embudo de conversión" subtitle="últimos 7 días" />
        <Card className="p-5">
          {funnel.length === 0 ? (
            <EmptyCard icon={BarChart2} text="Sin datos de análitica todavía" />
          ) : (
            <div className="flex flex-col gap-4">
              {funnel.map((row, i) => {
                const pct = row.conversionFromPrevious !== null
                  ? Math.round(row.conversionFromPrevious * 100)
                  : 100;
                const maxSessions = funnel[0]?.sessions ?? 1;
                const barPct = Math.round((row.sessions / maxSessions) * 100);
                return (
                  <div key={row.step} className="flex items-center gap-3">
                    <div className="flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-[#C9748A]/10 text-[10px] font-bold text-[#C9748A]">
                      {i + 1}
                    </div>
                    <span className="w-32 shrink-0 text-xs font-medium text-[#29252A]">
                      {FUNNEL_LABELS[row.step] ?? row.step}
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#F4EFEc]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#C9748A] transition-all"
                        style={{ width: `${barPct}%`, opacity: 1 - i * 0.15 }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-[#29252A]/50">
                      {row.sessions.toLocaleString("es-VE")}
                    </span>
                    {row.conversionFromPrevious !== null && (
                      <span className={`w-10 shrink-0 text-right text-xs font-bold ${pct >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Productos top */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionHeader title="Más vistos" subtitle="últimos 7 días" />
          <Card>
            {mostViewed.length === 0 ? (
              <div className="p-5"><EmptyCard icon={Eye} text="Sin datos todavía" /></div>
            ) : (
              <ul>
                {mostViewed.map((row, i) => (
                  <li
                    key={row.entityId}
                    className={`flex items-center justify-between px-5 py-3 ${i > 0 ? "border-t border-[#EBE4E1]" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-[#29252A]/20 w-4 shrink-0">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-[#29252A]">
                        {row.productName ?? row.entityId}
                      </span>
                    </div>
                    <span className="ml-4 shrink-0 text-xs font-semibold text-[#29252A]/40">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader title="Más al carrito" subtitle="últimos 7 días" />
          <Card>
            {mostAdded.length === 0 ? (
              <div className="p-5"><EmptyCard icon={ShoppingCart} text="Sin datos todavía" /></div>
            ) : (
              <ul>
                {mostAdded.map((row, i) => (
                  <li
                    key={row.entityId}
                    className={`flex items-center justify-between px-5 py-3 ${i > 0 ? "border-t border-[#EBE4E1]" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-[#29252A]/20 w-4 shrink-0">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-[#29252A]">
                        {row.productName ?? row.entityId}
                      </span>
                    </div>
                    <span className="ml-4 shrink-0 text-xs font-semibold text-[#29252A]/40">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Sin stock + Tráfico */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionHeader title="Sin stock" />
          <Card>
            {outOfStock.length === 0 ? (
              <div className="px-5 py-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-emerald-700">Todo el catálogo tiene stock</p>
              </div>
            ) : (
              <ul>
                {outOfStock.map((row, i) => (
                  <li
                    key={row.variantId}
                    className={`flex items-center justify-between px-5 py-3 ${i > 0 ? "border-t border-[#EBE4E1]" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                      <span className="truncate text-sm text-[#29252A]">
                        {row.productName} — <span className="text-[#29252A]/60">{row.variantLabel}</span>
                      </span>
                    </div>
                    <span className="ml-3 shrink-0 font-mono text-xs text-[#29252A]/40">{row.sku}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader title="Tráfico y sucursales" subtitle="últimos 7 días" />
          <Card className="p-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9748A]/10">
                  <Store size={16} className="text-[#C9748A]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Sucursal líder</p>
                  <p className="text-sm font-semibold text-[#29252A]">
                    {topStore
                      ? `${topStore.storeName} · ${topStore.orderCount} pedidos`
                      : "Sin datos"}
                  </p>
                </div>
              </div>

              {topSources.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                    Fuentes de tráfico
                  </p>
                  <ul className="flex flex-col gap-1">
                    {topSources.map((row) => {
                      const maxCount = topSources[0]?.sessionCount ?? 1;
                      const barPct = Math.round((row.sessionCount / maxCount) * 100);
                      return (
                        <li key={row.source} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 truncate text-xs text-[#29252A]/70">{row.source}</span>
                          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#F4EFEc]">
                            <div className="absolute inset-y-0 left-0 rounded-full bg-[#C9748A]/40" style={{ width: `${barPct}%` }} />
                          </div>
                          <span className="w-12 shrink-0 text-right text-xs font-semibold text-[#29252A]/50">
                            {row.sessionCount}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {topSources.length === 0 && !topStore && (
                <EmptyCard icon={BarChart2} text="Sin datos de tráfico todavía" />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
