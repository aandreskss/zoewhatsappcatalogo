import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface ABTestConfig {
  enabled: boolean
  lpUrl: string
  percentage: number
}

// ── Config cache ────────────────────────────────────────────────────────────
// Module-level cache shared across requests in the same edge instance.
// Each instance fetches independently; propagation delay ≤ 60 s after save.
const CACHE_TTL_MS = 60_000

let _cache: { config: ABTestConfig; ts: number } | null = null

async function fetchABConfig(): Promise<ABTestConfig> {
  const DEFAULT: ABTestConfig = { enabled: false, lpUrl: "/lp/promo50", percentage: 20 }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return DEFAULT

  const now = Date.now()
  if (_cache && now - _cache.ts < CACHE_TTL_MS) return _cache.config

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/company_settings?key=eq.ab_test_config&select=value&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        // Edge fetch — no Next.js cache layer, just the module-level one above
        cache: "no-store",
      },
    )

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const rows = (await res.json()) as { value: unknown }[]
    const raw = rows[0]?.value
    const parsed: ABTestConfig =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? {
            enabled: (raw as Record<string, unknown>).enabled === true,
            lpUrl:
              typeof (raw as Record<string, unknown>).lpUrl === "string"
                ? String((raw as Record<string, unknown>).lpUrl)
                : DEFAULT.lpUrl,
            percentage:
              typeof (raw as Record<string, unknown>).percentage === "number"
                ? Math.max(1, Math.min(99, Number((raw as Record<string, unknown>).percentage)))
                : DEFAULT.percentage,
          }
        : DEFAULT

    _cache = { config: parsed, ts: now }
    return parsed
  } catch {
    // On error, keep using the stale cache or fall back to default
    return _cache?.config ?? DEFAULT
  }
}

// ── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // A/B test applies only on the root path
  if (pathname !== "/") return NextResponse.next()

  // Let bots / crawlers see the catalog as-is
  const ua = request.headers.get("user-agent") ?? ""
  if (/bot|crawl|spider|facebookexternalhit|Googlebot/i.test(ua)) {
    return NextResponse.next()
  }

  const abConfig = await fetchABConfig()

  // A/B disabled → everyone sees the catalog
  if (!abConfig.enabled) return NextResponse.next()

  const AB_COOKIE = "zoe_ab"
  const LP_VARIANT = "lp"

  const existingVariant = request.cookies.get(AB_COOKIE)?.value
  const ratio = abConfig.percentage / 100
  const variant = existingVariant ?? (Math.random() < ratio ? LP_VARIANT : "catalog")

  const response =
    variant === LP_VARIANT
      ? NextResponse.rewrite(new URL(abConfig.lpUrl, request.url))
      : NextResponse.next()

  // Stick the visitor to their variant for 30 days
  if (!existingVariant) {
    response.cookies.set(AB_COOKIE, variant, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  }

  return response
}

export const config = {
  // Run only on the root path; skip Next.js internals
  matcher: ["/"],
}
