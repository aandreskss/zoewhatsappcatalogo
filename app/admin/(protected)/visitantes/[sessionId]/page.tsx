import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SourceInfo = { label: string; className: string };

function resolveSource(utmSource: string | null, referrer: string | null): SourceInfo {
  const src = (utmSource ?? "").toLowerCase();
  const ref = (referrer ?? "").toLowerCase();

  if (src.includes("google") || ref.includes("google.com"))
    return { label: "Google", className: "bg-blue-50 text-blue-700" };
  if (src.includes("facebook") || src.includes("fb") || ref.includes("facebook.com"))
    return { label: "Facebook", className: "bg-[#1877F2]/10 text-[#1877F2]" };
  if (src.includes("instagram") || ref.includes("instagram.com"))
    return { label: "Instagram", className: "bg-pink-50 text-pink-700" };
  if (src.includes("tiktok") || ref.includes("tiktok.com"))
    return { label: "TikTok", className: "bg-slate-100 text-slate-700" };
  if (src.includes("whatsapp") || ref.includes("whatsapp.com") || ref.includes("wa.me"))
    return { label: "WhatsApp", className: "bg-green-50 text-green-700" };
  if (src.includes("twitter") || src.includes("x.com") || ref.includes("x.com"))
    return { label: "Twitter / X", className: "bg-slate-100 text-slate-800" };
  if (utmSource)
    return { label: utmSource, className: "bg-[#F4EFEc] text-[#29252A]/60" };
  if (referrer) {
    let host = referrer;
    try { host = new URL(referrer).hostname.replace(/^www\./, ""); } catch { /* invalid url */ }
    return { label: host, className: "bg-[#F4EFEc] text-[#29252A]/60" };
  }
  return { label: "Directo", className: "bg-[#F4EFEc] text-[#29252A]/40" };
}

type AnalyticsEvent = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  created_at: string;
};

const EVENT_CONFIG: Record<string, { label: string; dot: string }> = {
  page_view: { label: "Vio página", dot: "#9CA3AF" },
  view_product: { label: "Vio producto", dot: "#3B82F6" },
  search: { label: "Buscó", dot: "#8B5CF6" },
  filter_applied: { label: "Filtró catálogo", dot: "#6366F1" },
  view_category: { label: "Vio categoría", dot: "#0EA5E9" },
  add_to_cart: { label: "Agregó al carrito", dot: "#F59E0B" },
  remove_from_cart: { label: "Quitó del carrito", dot: "#EF4444" },
  begin_checkout: { label: "Inició pago", dot: "#F97316" },
  checkout_completed: { label: "Completó compra", dot: "#10B981" },
  whatsapp_clicked: { label: "Abrió WhatsApp", dot: "#22C55E" },
  favorite_added: { label: "Guardó favorito", dot: "#EC4899" },
};

function getEventDetail(event: AnalyticsEvent): string | null {
  const m = event.metadata;
  switch (event.event_type) {
    case "page_view":
      return m.page ? `/${m.page as string}` : null;
    case "view_product":
      return (m.productName as string) ?? event.entity_id ?? null;
    case "search":
      return m.query ? `"${m.query as string}"` : null;
    case "filter_applied": {
      const parts: string[] = [];
      if (m.categoria) parts.push(`Cat: ${m.categoria}`);
      if (m.marca) parts.push(`Marca: ${m.marca}`);
      if (m.orden && m.orden !== "recientes") parts.push(`Orden: ${m.orden}`);
      if (m.precioMin || m.precioMax)
        parts.push(`$${m.precioMin ?? 0}–$${m.precioMax ?? "∞"}`);
      if (m.resultsCount !== undefined)
        parts.push(`${m.resultsCount} resultado${m.resultsCount !== 1 ? "s" : ""}`);
      return parts.join(" · ") || null;
    }
    case "view_category":
      return (m.categoryName as string) ?? (m.categorySlug as string) ?? null;
    case "add_to_cart":
      return (m.productName as string) ?? event.entity_id ?? null;
    case "remove_from_cart":
      return (m.productName as string) ?? null;
    case "begin_checkout":
      return m.itemCount
        ? `${m.itemCount} ítem${Number(m.itemCount) !== 1 ? "s" : ""}`
        : null;
    case "checkout_completed":
      return m.orderId ? `Orden #${m.orderId}` : null;
    case "whatsapp_clicked":
      return (m.source as string) ?? null;
    case "favorite_added":
      return (m.productName as string) ?? null;
    default:
      return null;
  }
}

function groupByDate(
  events: AnalyticsEvent[],
): Array<{ date: string; events: AnalyticsEvent[] }> {
  const map = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const key = new Date(event.created_at).toLocaleDateString("es-VE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const existing = map.get(key);
    if (existing) {
      existing.push(event);
    } else {
      map.set(key, [event]);
    }
  }
  return Array.from(map.entries()).map(([date, evts]) => ({ date, events: evts }));
}

export default async function VisitanteDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: raw } = await supabase
    .from("analytics_events")
    .select(
      "id, event_type, entity_type, entity_id, metadata, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, created_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (!raw || raw.length === 0) notFound();

  const events = raw.map((e) => ({
    ...e,
    metadata: (e.metadata ?? {}) as Record<string, unknown>,
  })) as AnalyticsEvent[];

  const first = events[0];
  const last = events[events.length - 1];
  const completedPurchase = events.some((e) => e.event_type === "checkout_completed");
  const reachedCheckout = events.some((e) => e.event_type === "begin_checkout");
  const hasAttribution =
    first.utm_source || first.utm_medium || first.utm_campaign || first.referrer;
  const source = resolveSource(first.utm_source, first.referrer);

  const groups = groupByDate(events);

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/admin/visitantes"
        className="inline-flex items-center gap-1.5 text-sm text-[#29252A]/50 hover:text-[#29252A] transition-colors w-fit"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Visitantes
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-[#EBE4E1] bg-white p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-lg bg-[#C9748A]/10 px-3 py-1.5 font-mono text-sm font-semibold text-[#C9748A]">
            #{sessionId.slice(0, 8)}
          </span>
          {/* Traffic source */}
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${source.className}`}>
            {source.label}
          </span>
          {completedPurchase && (
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Compró
            </span>
          )}
          {!completedPurchase && reachedCheckout && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Abandonó
            </span>
          )}
        </div>

        <p className="mt-2 font-mono text-[11px] text-[#29252A]/30 break-all">{sessionId}</p>

        <div className="mt-4 flex gap-6 flex-wrap">
          <div>
            <p className="text-xs text-[#29252A]/40">Eventos</p>
            <p className="text-xl font-semibold text-[#29252A]">{events.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#29252A]/40">Primera visita</p>
            <p className="text-sm font-medium text-[#29252A]">
              {new Date(first.created_at).toLocaleDateString("es-VE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#29252A]/40">Última actividad</p>
            <p className="text-sm font-medium text-[#29252A]">
              {new Date(last.created_at).toLocaleDateString("es-VE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="rounded-xl border border-[#EBE4E1] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#29252A]/40 mb-3">
          Atribución
        </p>
        {hasAttribution ? (
          <div className="flex gap-2 flex-wrap">
            {first.utm_source && (
              <span className="rounded-full bg-[#F4EFEc] px-3 py-1 text-xs text-[#29252A]">
                <span className="text-[#29252A]/40">Fuente: </span>
                {first.utm_source}
              </span>
            )}
            {first.utm_medium && (
              <span className="rounded-full bg-[#F4EFEc] px-3 py-1 text-xs text-[#29252A]">
                <span className="text-[#29252A]/40">Medio: </span>
                {first.utm_medium}
              </span>
            )}
            {first.utm_campaign && (
              <span className="rounded-full bg-[#F4EFEc] px-3 py-1 text-xs text-[#29252A]">
                <span className="text-[#29252A]/40">Campaña: </span>
                {first.utm_campaign}
              </span>
            )}
            {first.utm_content && (
              <span className="rounded-full bg-[#F4EFEc] px-3 py-1 text-xs text-[#29252A]">
                <span className="text-[#29252A]/40">Contenido: </span>
                {first.utm_content}
              </span>
            )}
            {first.referrer && (
              <span className="rounded-full bg-[#F4EFEc] px-3 py-1 text-xs text-[#29252A] max-w-xs truncate">
                <span className="text-[#29252A]/40">Referrer: </span>
                {first.referrer}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#29252A]/40">Tráfico directo</p>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-[#EBE4E1] bg-white overflow-hidden">
        <div className="border-b border-[#EBE4E1] px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#29252A]/40">
            Recorrido del visitante
          </p>
        </div>
        <div className="p-5 space-y-7">
          {groups.map(({ date, events: dayEvents }) => (
            <div key={date}>
              <p className="capitalize text-xs font-semibold text-[#29252A]/40 mb-3 border-b border-[#EBE4E1] pb-2">
                {date}
              </p>
              <div className="space-y-1">
                {dayEvents.map((event) => {
                  const config = EVENT_CONFIG[event.event_type] ?? {
                    label: event.event_type,
                    dot: "#9CA3AF",
                  };
                  const detail = getEventDetail(event);
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-1.5">
                      <div
                        className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.dot }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-[#29252A]">
                          {config.label}
                        </span>
                        {detail && (
                          <span className="ml-2 text-sm text-[#29252A]/55">{detail}</span>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-xs text-[#29252A]/35">
                        {new Date(event.created_at).toLocaleTimeString("es-VE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
