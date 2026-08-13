import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

export type CurrencyPair = "USD/VES" | "EUR/VES";

interface ProviderRateResult {
  rate: number;
  fetchedAt: string;
}

/**
 * Adaptador de tasa de cambio (sección 15/47 del plan). El BCV no publica
 * una API REST oficial propia — la arquitectura nunca se ata a un único
 * proveedor no confirmado, sino a esta interfaz intercambiable. `manual`
 * (el admin escribe la tasa a mano) siempre está disponible como
 * respaldo garantizado; `dolarapi` es el primer adaptador automático,
 * verificado en vivo contra la API real antes de escribir este código
 * (`GET https://ve.dolarapi.com/v1/dolares/oficial` y
 * `/v1/euros/oficial`, ambos devuelven `{ promedio, fechaActualizacion,
 * ... }`) — nunca se asumió el contrato sin confirmarlo, siguiendo la
 * regla permanente de "no inventar APIs".
 */
export interface ExchangeRateProvider {
  readonly source: "dolarapi";
  fetchRate(pair: CurrencyPair): Promise<ProviderRateResult>;
}

const DOLARAPI_PATH: Record<CurrencyPair, string> = {
  "USD/VES": "https://ve.dolarapi.com/v1/dolares/oficial",
  "EUR/VES": "https://ve.dolarapi.com/v1/euros/oficial",
};

interface DolarApiResponse {
  moneda: string;
  fuente: string;
  promedio: number | null;
  fechaActualizacion: string;
}

export const dolarApiProvider: ExchangeRateProvider = {
  source: "dolarapi",
  async fetchRate(pair: CurrencyPair): Promise<ProviderRateResult> {
    const controller = new AbortController();
    // Nunca una espera indefinida a un proveedor externo (sección 15 del
    // plan): timeout corto y explícito.
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(DOLARAPI_PATH[pair], {
        signal: controller.signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`DolarApi respondió ${res.status}`);
      }
      const data = (await res.json()) as DolarApiResponse;
      if (typeof data.promedio !== "number" || data.promedio <= 0) {
        throw new Error("DolarApi no devolvió un promedio numérico válido");
      }
      return { rate: data.promedio, fetchedAt: data.fechaActualizacion };
    } finally {
      clearTimeout(timeout);
    }
  },
};

/** Orden de proveedores automáticos a intentar — hoy solo hay uno confirmado, pero el diseño admite agregar más sin tocar el resto del sistema. */
const AUTOMATIC_PROVIDERS: ExchangeRateProvider[] = [dolarApiProvider];

export interface RefreshResult {
  pair: CurrencyPair;
  ok: boolean;
  provider?: string;
  rate?: number;
  error?: string;
}

/**
 * Intenta cada proveedor automático en orden de prioridad para cada par
 * de moneda; el primero que responde gana. Nunca lanza — un proveedor
 * caído no debe romper el catálogo ni el checkout (sección 15,
 * "resiliencia"). Cada intento (éxito o fallo) queda en
 * `exchange_rate_fetch_logs` para observabilidad, y cada éxito además
 * inserta una fila nueva en `exchange_rates` (histórico, nunca se
 * sobreescribe una tasa ya usada por un pedido).
 */
export async function refreshAutomaticExchangeRates(
  supabase: DB,
  pairs: CurrencyPair[] = ["USD/VES", "EUR/VES"],
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  for (const pair of pairs) {
    let succeeded = false;

    for (const provider of AUTOMATIC_PROVIDERS) {
      try {
        const { rate, fetchedAt } = await provider.fetchRate(pair);

        const { error: insertError } = await supabase.from("exchange_rates").insert({
          currency_pair: pair,
          rate,
          source: provider.source,
          is_automatic: true,
          fetched_at: fetchedAt,
          effective_at: fetchedAt,
        });
        if (insertError) throw insertError;

        await supabase.from("exchange_rate_fetch_logs").insert({
          provider: provider.source,
          success: true,
        });

        results.push({ pair, ok: true, provider: provider.source, rate });
        succeeded = true;
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        await supabase.from("exchange_rate_fetch_logs").insert({
          provider: provider.source,
          success: false,
          error_message: message,
        });
        // Se sigue con el próximo proveedor de la lista, no se propaga
        // el error todavía — solo si ninguno funcionó para este par.
      }
    }

    if (!succeeded) {
      results.push({ pair, ok: false, error: "Ningún proveedor automático respondió" });
    }
  }

  return results;
}
