import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

async function logRun(
  supabase: DB,
  entry: Database["public"]["Tables"]["cron_job_runs"]["Insert"],
): Promise<void> {
  try {
    await supabase.from("cron_job_runs").insert(entry);
  } catch {
    // Best-effort a propósito: un fallo al ESCRIBIR el log de auditoría
    // del cron nunca debe ocultar ni reemplazar el resultado (o error)
    // real del job — ver `withCronLog` abajo.
  }
}

/**
 * Envuelve la ejecución de un cron job para dejar un registro uniforme en
 * `cron_job_runs` (sección 12 del plan, migración 0020) — éxito/fallo,
 * cuándo empezó, y un `detail` libre con lo que cada job considere útil
 * (ej. cuántas reservas se liberaron). El panel de salud del admin
 * (`/admin/salud`) lee esta tabla para detectar un cron que dejó de
 * correr o que empezó a fallar silenciosamente.
 */
export async function withCronLog<T>(
  supabase: DB,
  jobName: string,
  run: () => Promise<T>,
  toDetail?: (result: T) => Json,
): Promise<T> {
  const startedAt = new Date().toISOString();

  try {
    const result = await run();
    await logRun(supabase, {
      job_name: jobName,
      success: true,
      started_at: startedAt,
      detail: toDetail ? toDetail(result) : null,
    });
    return result;
  } catch (err) {
    await logRun(supabase, {
      job_name: jobName,
      success: false,
      started_at: startedAt,
      detail: { error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}
