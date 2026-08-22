import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import {
  getAllCurrentRates,
  getRecentFetchLogs,
  getVesReferenceCurrency,
} from "@/lib/domain/currency";
import { formatVes } from "@/lib/domain/pricing";
import { ManualRateForm } from "@/components/admin/manual-rate-form";
import { RefreshRatesButton } from "@/components/admin/refresh-rates-button";
import { ReferenceCurrencySelect } from "@/components/admin/reference-currency-select";

export const dynamic = "force-dynamic";

const PAIR_LABEL: Record<string, string> = {
  "USD/VES": "Dólar → Bolívar",
  "EUR/VES": "Euro → Bolívar",
};

/**
 * Panel de monedas (sección 15/19 del plan). Muestra ambos pares con su
 * antigüedad — nunca oculta que una tasa está vencida, para que el
 * equipo la confirme o actualice antes de que genere una disputa con un
 * cliente (sección 44, riesgos comerciales).
 */
export default async function MonedasPage() {
  const supabase = createSupabaseServiceRoleClient();
  const [rates, logs, reference] = await Promise.all([
    getAllCurrentRates(supabase),
    getRecentFetchLogs(supabase),
    getVesReferenceCurrency(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Monedas y tasa de cambio</h1>
        <RefreshRatesButton />
      </div>

      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 text-sm">
        <span className="text-[var(--color-muted-foreground)]">
          Moneda de referencia para calcular el equivalente en Bs:
        </span>
        <ReferenceCurrencySelect value={reference} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["USD/VES", "EUR/VES"] as const).map((pair) => {
          const rate = rates[pair];
          return (
            <div
              key={pair}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
            >
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {PAIR_LABEL[pair]}
              </p>
              {rate ? (
                <>
                  <p className="text-2xl font-semibold">{formatVes(rate.rate)}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    Fuente: {rate.source} · actualizada{" "}
                    {new Date(rate.fetchedAt).toLocaleString("es-VE")}
                  </p>
                  {rate.isStale ? (
                    <p className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 px-2 py-1 text-xs font-medium text-[var(--color-error)]">
                      Tasa con más de {Math.round(rate.hoursSinceFetch)}h de antigüedad —
                      confírmala o actualízala.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Todavía no hay ninguna tasa registrada para este par.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
        <h2 className="mb-3 font-medium">Cargar tasa manual</h2>
        <ManualRateForm />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
        <h2 className="mb-3 font-medium">Últimos intentos automáticos</h2>
        <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between py-2">
              <span>
                {log.provider} —{" "}
                <span
                  className={
                    log.success
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-error)]"
                  }
                >
                  {log.success ? "OK" : (log.errorMessage ?? "Error")}
                </span>
              </span>
              <span className="text-[var(--color-muted-foreground)]">
                {new Date(log.createdAt).toLocaleString("es-VE")}
              </span>
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="py-2 text-[var(--color-muted-foreground)]">
              Todavía no se ha intentado ninguna actualización automática.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
