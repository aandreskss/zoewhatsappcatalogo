import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

export type IntegrationProvider =
  | "ga4"
  | "gtm"
  | "meta_pixel"
  | "meta_capi"
  | "tiktok"
  | "google_ads"
  | "bcv_rate_provider";

export interface PublicIntegrationConfig {
  provider: IntegrationProvider;
  publicConfig: Record<string, unknown>;
}

/**
 * IDs de analítica (GA4 measurement id, GTM container id, Meta Pixel id,
 * TikTok pixel id) son configuración específica de la cuenta de Zoe —
 * como cualquier otro dato de negocio, NUNCA se hardcodean en código ni
 * vía variable de entorno fija (regla permanente del proyecto); viven en
 * `integrations.public_config` y se administran desde
 * `/admin/integraciones/analytics`. `secret_ref` (para Meta CAPI/Google
 * Ads, que si requieren un secreto server-side) nunca se expone aquí —
 * solo se guarda el NOMBRE de la variable de entorno donde vive el
 * secreto real, no el valor.
 */
export async function getActivePublicIntegrations(
  supabase: DB,
): Promise<PublicIntegrationConfig[]> {
  const { data } = await supabase
    .from("integrations")
    .select("provider, public_config")
    .eq("active", true)
    .in("provider", ["ga4", "gtm", "meta_pixel", "tiktok"]);

  return (data ?? []).map((row) => ({
    provider: row.provider,
    publicConfig: (row.public_config ?? {}) as Record<string, unknown>,
  }));
}
