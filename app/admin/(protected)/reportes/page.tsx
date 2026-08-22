import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Reporte mínimo de búsquedas (sección 21/46 del plan): qué buscan las
 * clientas y qué búsquedas no encuentran nada — información directamente
 * accionable para decidir qué producto agregar o cómo nombrar lo que ya
 * existe. El dashboard ejecutivo completo con embudo de conversión llega
 * en la Fase 9 (Analítica) sobre `analytics_events`.
 */
export default async function ReportesPage() {
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: withoutResults }, { data: recent }] = await Promise.all([
    supabase
      .from("search_logs")
      .select("id, query, created_at")
      .eq("results_count", 0)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("search_logs")
      .select("id, query, results_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Reportes de búsqueda</h1>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
        <h2 className="mb-3 font-medium">Búsquedas sin resultados</h2>
        <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
          {(withoutResults ?? []).map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2">
              <span>&ldquo;{row.query}&rdquo;</span>
              <span className="text-[var(--color-muted-foreground)]">
                {new Date(row.created_at).toLocaleString("es-VE")}
              </span>
            </li>
          ))}
          {(withoutResults ?? []).length === 0 ? (
            <li className="py-2 text-[var(--color-muted-foreground)]">
              Ninguna búsqueda reciente quedó sin resultados.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
        <h2 className="mb-3 font-medium">Búsquedas recientes</h2>
        <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
          {(recent ?? []).map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2">
              <span>
                &ldquo;{row.query}&rdquo; — {row.results_count}{" "}
                {row.results_count === 1 ? "resultado" : "resultados"}
              </span>
              <span className="text-[var(--color-muted-foreground)]">
                {new Date(row.created_at).toLocaleString("es-VE")}
              </span>
            </li>
          ))}
          {(recent ?? []).length === 0 ? (
            <li className="py-2 text-[var(--color-muted-foreground)]">
              Todavía no hay búsquedas registradas.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
