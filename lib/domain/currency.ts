import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

export interface ActiveExchangeRate {
  rate: number;
  currencyPair: string;
  source: string;
  fetchedAt: string;
}

/**
 * Última tasa vigente para un par de moneda. Ver sección 15 del plan: en
 * la Fase 0/2 solo existe la tasa `manual` sembrada por seed.sql — el
 * adaptador `bcv_automatic` (DolarApi.com/pydolarve/BCV API) se conecta en
 * la Fase 6, sin que el resto del sistema tenga que cambiar (esta función
 * ya lee "la más reciente", sin importar la fuente).
 */
export async function getActiveExchangeRate(
  supabase: DB,
  currencyPair: "USD/VES" | "EUR/VES",
): Promise<ActiveExchangeRate | null> {
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate, currency_pair, source, fetched_at")
    .eq("currency_pair", currencyPair)
    .order("effective_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    rate: data.rate,
    currencyPair: data.currency_pair,
    source: data.source,
    fetchedAt: data.fetched_at,
  };
}

/**
 * Resuelve qué par usar según `company_settings.ves_reference_currency`
 * (decisión confirmada: el admin elige USD o EUR como referencia — sección
 * 15 del plan) y devuelve la tasa vigente para ese par, o `null` si todavía
 * no hay ninguna tasa registrada (el catálogo debe poder mostrarse solo en
 * USD en ese caso, nunca romperse).
 */
export async function getVesReferenceRate(
  supabase: DB,
): Promise<ActiveExchangeRate | null> {
  const { data: settingRow } = await supabase
    .from("company_settings")
    .select("value")
    .eq("key", "ves_reference_currency")
    .maybeSingle();

  const reference = (settingRow?.value as string | undefined) ?? "USD";
  const pair = reference === "EUR" ? "EUR/VES" : "USD/VES";

  return getActiveExchangeRate(supabase, pair);
}
