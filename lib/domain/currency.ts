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
  const reference = await getVesReferenceCurrency(supabase);
  const pair = reference === "EUR" ? "EUR/VES" : "USD/VES";
  return getActiveExchangeRate(supabase, pair);
}

export async function getVesReferenceCurrency(supabase: DB): Promise<"USD" | "EUR"> {
  const { data: settingRow } = await supabase
    .from("company_settings")
    .select("value")
    .eq("key", "ves_reference_currency")
    .maybeSingle();

  return (settingRow?.value as string | undefined) === "EUR" ? "EUR" : "USD";
}

/** Antigüedad (en horas) a partir de la cual una tasa se considera vencida y el admin debe confirmarla o actualizarla a mano (sección 15, "resiliencia"). */
export const STALE_RATE_HOURS = 48;

export interface RateWithStaleness extends ActiveExchangeRate {
  isStale: boolean;
  hoursSinceFetch: number;
}

/**
 * Usado por el panel admin (`/admin/finanzas/monedas`) para mostrar el
 * estado de ambos pares a la vez, con antigüedad visible — nunca se
 * bloquea el catálogo por una tasa vencida, pero el admin sí debe verlo
 * de inmediato al entrar al dashboard.
 */
export async function getAllCurrentRates(
  supabase: DB,
): Promise<Record<"USD/VES" | "EUR/VES", RateWithStaleness | null>> {
  const [usd, eur] = await Promise.all([
    getActiveExchangeRate(supabase, "USD/VES"),
    getActiveExchangeRate(supabase, "EUR/VES"),
  ]);

  function withStaleness(rate: ActiveExchangeRate | null): RateWithStaleness | null {
    if (!rate) return null;
    const hoursSinceFetch =
      (Date.now() - new Date(rate.fetchedAt).getTime()) / (1000 * 60 * 60);
    return { ...rate, hoursSinceFetch, isStale: hoursSinceFetch > STALE_RATE_HOURS };
  }

  return { "USD/VES": withStaleness(usd), "EUR/VES": withStaleness(eur) };
}

export interface ExchangeRateFetchLogEntry {
  id: string;
  provider: string;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export async function getRecentFetchLogs(
  supabase: DB,
  limit = 10,
): Promise<ExchangeRateFetchLogEntry[]> {
  const { data } = await supabase
    .from("exchange_rate_fetch_logs")
    .select("id, provider, success, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    success: row.success,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}
