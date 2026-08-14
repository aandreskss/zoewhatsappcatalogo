import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

export interface CronJobHealth {
  jobName: string;
  lastRun: {
    success: boolean;
    startedAt: string;
    finishedAt: string;
  } | null;
  /** true si nunca corrió, el último intento fue un error, o pasó demasiado tiempo desde la última corrida. */
  isStale: boolean;
}

/**
 * Intervalo esperado de cada cron job, en minutos — debe reflejar
 * `vercel.json`. Con margen (`STALE_FACTOR`): no se marca "atrasado" al
 * primer minuto de retraso (Vercel Cron no es puntual al segundo), solo
 * cuando el atraso ya es sospechoso.
 */
const EXPECTED_JOBS: { jobName: string; expectedMinutes: number }[] = [
  { jobName: "release-reservations", expectedMinutes: 5 },
  { jobName: "refresh-exchange-rates", expectedMinutes: 120 },
];

const STALE_FACTOR = 3;

/**
 * Estado de salud de cada cron job conocido (sección 12 del plan) — lee
 * la última fila de `cron_job_runs` (migración 0020) por job y decide si
 * está "al día" o "atrasado/con errores". Se basa en una lista fija de
 * jobs esperados (no en lo que haya en la tabla) para poder detectar
 * también el caso "este job JAMÁS registró una corrida".
 */
export async function getCronJobsHealth(supabase: DB): Promise<CronJobHealth[]> {
  const results: CronJobHealth[] = [];

  for (const job of EXPECTED_JOBS) {
    const { data } = await supabase
      .from("cron_job_runs")
      .select("success, started_at, finished_at")
      .eq("job_name", job.jobName)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastRun = data
      ? {
          success: data.success,
          startedAt: data.started_at,
          finishedAt: data.finished_at,
        }
      : null;

    const staleThresholdMs = job.expectedMinutes * 60_000 * STALE_FACTOR;
    const isStale =
      !lastRun ||
      !lastRun.success ||
      Date.now() - new Date(lastRun.finishedAt).getTime() > staleThresholdMs;

    results.push({ jobName: job.jobName, lastRun, isStale });
  }

  return results;
}

export interface RecentErrorReport {
  id: string;
  scope: string;
  message: string;
  createdAt: string;
}

/**
 * Últimos errores capturados (sección 12 del plan) — lee `error_reports`
 * (migración 0021), llenada por `reportError` sin importar si Sentry
 * está configurado o no.
 */
export async function getRecentErrorReports(
  supabase: DB,
  limit = 20,
): Promise<RecentErrorReport[]> {
  const { data } = await supabase
    .from("error_reports")
    .select("id, scope, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    scope: row.scope,
    message: row.message,
    createdAt: row.created_at,
  }));
}
