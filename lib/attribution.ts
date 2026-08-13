import "server-only";
import { cookies } from "next/headers";

const ATTRIBUTION_COOKIE = "zoe_attribution";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  referrer?: string;
  landingPath?: string;
  capturedAt: string;
}

const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

/**
 * Se llama desde `proxy.ts` en cada request. Solo escribe la cookie la
 * PRIMERA vez que se detectan parámetros de campaña (first-touch
 * attribution, sección 32/41 del plan) — así "de dónde vino este pedido"
 * sigue reflejando el primer clic del cliente, no el último enlace que
 * tocó antes de pagar.
 */
export function captureAttributionFromUrl(
  url: URL,
  referrer: string | null,
  existingCookieValue: string | undefined,
): string | null {
  if (existingCookieValue) return null; // ya hay first-touch guardado, no sobreescribir

  const found: Record<string, string> = {};
  for (const key of TRACKED_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) found[key] = value;
  }

  if (Object.keys(found).length === 0) return null;

  const attribution: Attribution = {
    utmSource: found.utm_source,
    utmMedium: found.utm_medium,
    utmCampaign: found.utm_campaign,
    utmContent: found.utm_content,
    utmTerm: found.utm_term,
    fbclid: found.fbclid,
    gclid: found.gclid,
    ttclid: found.ttclid,
    referrer: referrer ?? undefined,
    landingPath: url.pathname,
    capturedAt: new Date().toISOString(),
  };

  return JSON.stringify(attribution);
}

export const ATTRIBUTION_COOKIE_NAME = ATTRIBUTION_COOKIE;
export const ATTRIBUTION_COOKIE_MAX_AGE = THIRTY_DAYS_SECONDS;

export async function getAttribution(): Promise<Attribution | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Attribution;
  } catch {
    return null;
  }
}
