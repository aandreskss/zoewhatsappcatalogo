import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/db/supabase/middleware";

// ── A/B test config cache ────────────────────────────────────────────────────
// Module-level cache shared across requests in the same edge instance.
// Each instance refetches independently; propagation delay ≤ 60 s after save.

interface ABConfig { enabled: boolean; lpUrl: string; percentage: number }
let _abCache: { config: ABConfig; ts: number } | null = null
const AB_CACHE_TTL = 60_000

async function fetchABConfig(): Promise<ABConfig> {
  const DEFAULT: ABConfig = { enabled: false, lpUrl: "/lp/promo50", percentage: 20 }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return DEFAULT

  const now = Date.now()
  if (_abCache && now - _abCache.ts < AB_CACHE_TTL) return _abCache.config

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/company_settings?key=eq.ab_test_config&select=value&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: "no-store",
      },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as { value: unknown }[]
    const raw = rows[0]?.value
    const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
    const parsed: ABConfig = o
      ? {
          enabled: o.enabled === true,
          lpUrl: typeof o.lpUrl === "string" ? o.lpUrl : DEFAULT.lpUrl,
          percentage: typeof o.percentage === "number" ? Math.max(1, Math.min(99, o.percentage)) : DEFAULT.percentage,
        }
      : DEFAULT
    _abCache = { config: parsed, ts: now }
    return parsed
  } catch {
    return _abCache?.config ?? DEFAULT
  }
}

// ── Proxy ────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── A/B test: only on root path, skip bots ────────────────────────────────
  if (pathname === "/") {
    const ua = request.headers.get("user-agent") ?? ""
    const isBot = /bot|crawl|spider|facebookexternalhit|Googlebot/i.test(ua)

    if (!isBot) {
      const abConfig = await fetchABConfig()

      if (abConfig.enabled) {
        const AB_COOKIE = "zoe_ab"
        const existing = request.cookies.get(AB_COOKIE)?.value
        const variant = existing ?? (Math.random() < abConfig.percentage / 100 ? "lp" : "catalog")

        if (variant === "lp") {
          // Rewrite transparently to the landing page — LP has no auth requirement
          const response = NextResponse.rewrite(new URL(abConfig.lpUrl, request.url))
          if (!existing) {
            response.cookies.set(AB_COOKIE, "lp", {
              maxAge: 60 * 60 * 24 * 30,
              httpOnly: true,
              sameSite: "lax",
              path: "/",
            })
          }
          return response
        }

        // catalog variant — run updateSession and attach the AB cookie
        const response = await updateSession(request)
        if (!existing) {
          response.cookies.set(AB_COOKIE, "catalog", {
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
          })
        }
        return response
      }
    }
  }

  // All other paths (and bots, and disabled A/B test) go through normally
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos y archivos de imagen —
     * necesitamos que corra en /admin/* (auth) y en el resto del sitio
     * (para mantener la sesión de Supabase fresca si en el futuro hay
     * áreas autenticadas fuera del admin, como una cuenta de cliente).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)",
  ],
};
