import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import {
  DEFAULT_SITE_CONTENT,
  type NavLink,
  type SiteContent,
} from "@/lib/domain/site-content-types";

export type { NavLink, SiteContent } from "@/lib/domain/site-content-types";
export { DEFAULT_SITE_CONTENT } from "@/lib/domain/site-content-types";

type DB = SupabaseClient<Database>;

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function parseSiteContent(raw: unknown): SiteContent {
  const d = DEFAULT_SITE_CONTENT;
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;

  let navLinks: NavLink[] = d.navLinks;
  if (Array.isArray(o.navLinks)) {
    const parsed = o.navLinks
      .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
      .map((n) => ({ label: str(n.label, ""), href: str(n.href, "/") }))
      .filter((n) => n.label);
    if (parsed.length > 0) navLinks = parsed.slice(0, 6);
  }

  return {
    heroLabel: str(o.heroLabel, d.heroLabel),
    heroTitle: str(o.heroTitle, d.heroTitle),
    heroSubtitle: str(o.heroSubtitle, d.heroSubtitle),
    heroCtaText: str(o.heroCtaText, d.heroCtaText),
    heroCtaHref: str(o.heroCtaHref, d.heroCtaHref),
    catalogLabel: str(o.catalogLabel, d.catalogLabel),
    promoLabel: str(o.promoLabel, d.promoLabel),
    promoTitle: str(o.promoTitle, d.promoTitle),
    promoSubtitle: str(o.promoSubtitle, d.promoSubtitle),
    promoCtaText: str(o.promoCtaText, d.promoCtaText),
    promoCtaHref: str(o.promoCtaHref, d.promoCtaHref),
    whatsapp: str(o.whatsapp, d.whatsapp),
    instagram: str(o.instagram, d.instagram),
    navLinks,
  };
}

export async function getSiteContent(supabase: DB): Promise<SiteContent> {
  const { data } = await supabase
    .from("company_settings")
    .select("value")
    .eq("key", "site_content")
    .maybeSingle();
  if (!data) return DEFAULT_SITE_CONTENT;
  return parseSiteContent(data.value);
}
