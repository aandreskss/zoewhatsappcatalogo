import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SessionSummary = {
  sessionId: string;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  entryPage: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  reachedCheckout: boolean;
  completedPurchase: boolean;
};

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

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD}d`;
}

export default async function VisitantesPage() {
  const supabase = createSupabaseServiceRoleClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from("analytics_events")
    .select("session_id, event_type, metadata, utm_source, utm_campaign, referrer, created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true })
    .limit(3000);

  const sessionMap = new Map<string, SessionSummary>();
  for (const event of events ?? []) {
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const existing = sessionMap.get(event.session_id);
    if (!existing) {
      sessionMap.set(event.session_id, {
        sessionId: event.session_id,
        eventCount: 1,
        firstSeen: event.created_at,
        lastSeen: event.created_at,
        entryPage: event.event_type === "page_view" ? ((meta.page as string) ?? null) : null,
        utmSource: event.utm_source,
        utmCampaign: event.utm_campaign,
        referrer: event.referrer,
        reachedCheckout: event.event_type === "begin_checkout",
        completedPurchase: event.event_type === "checkout_completed",
      });
    } else {
      existing.eventCount++;
      existing.lastSeen = event.created_at;
      if (event.event_type === "begin_checkout") existing.reachedCheckout = true;
      if (event.event_type === "checkout_completed") existing.completedPurchase = true;
    }
  }

  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 100);

  const total = sessionMap.size;
  const buyers = Array.from(sessionMap.values()).filter((s) => s.completedPurchase).length;
  const abandoned = Array.from(sessionMap.values()).filter(
    (s) => s.reachedCheckout && !s.completedPurchase,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#29252A]">Visitantes</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Visitantes (30d)", value: total, sub: "sesiones únicas" },
          {
            label: "Compradores",
            value: buyers,
            sub: total > 0 ? `${Math.round((buyers / total) * 100)}% conversión` : "—",
          },
          { label: "Abandonos", value: abandoned, sub: "llegaron al pago" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#EBE4E1] bg-white p-4">
            <p className="text-xs text-[#29252A]/50">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#29252A]">{stat.value}</p>
            <p className="text-[10px] text-[#29252A]/40">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="rounded-xl border border-[#EBE4E1] bg-white overflow-hidden">
        <div className="border-b border-[#EBE4E1] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#29252A]/40">
            Sesiones recientes · últimos 30 días
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#29252A]/40">
            Sin datos aún — los eventos empezarán a aparecer cuando visiten el catálogo
          </p>
        ) : (
          <ul className="divide-y divide-[#EBE4E1]">
            {sessions.map((session) => {
              const source = resolveSource(session.utmSource, session.referrer);
              return (
                <li key={session.sessionId}>
                  <Link
                    href={`/admin/visitantes/${session.sessionId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F4EFEc] transition-colors"
                  >
                    {/* ID badge */}
                    <span className="shrink-0 rounded-lg bg-[#C9748A]/10 px-2 py-1 font-mono text-xs font-semibold text-[#C9748A]">
                      #{session.sessionId.slice(0, 8)}
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-[#29252A]">
                          {session.entryPage
                            ? `Entró por /${session.entryPage}`
                            : "Entrada desconocida"}
                        </span>
                        {/* Source badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${source.className}`}
                        >
                          {source.label}
                        </span>
                        {session.completedPurchase && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Compró
                          </span>
                        )}
                        {!session.completedPurchase && session.reachedCheckout && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Abandonó
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#29252A]/50">
                        {session.eventCount} evento{session.eventCount !== 1 ? "s" : ""}
                        {session.utmCampaign ? ` · ${session.utmCampaign}` : ""}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-[#29252A]">
                        {relativeTime(session.lastSeen)}
                      </p>
                      <p className="text-[10px] text-[#29252A]/40">
                        {new Date(session.firstSeen).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg
                      className="shrink-0 text-[#29252A]/20"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
