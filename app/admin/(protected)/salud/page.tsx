import { requireAdminUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getCronJobsHealth, getRecentErrorReports } from "@/lib/domain/health";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const JOB_LABELS: Record<string, string> = {
  "release-reservations": "Liberar reservas de stock vencidas",
  "refresh-exchange-rates": "Actualizar tasa de cambio (BCV)",
};

/**
 * Panel de salud interno (sección 12 del plan, Fase 12 — alcance "solo
 * código" acordado con el usuario: sin cuenta de uptime monitor real en
 * este sandbox). Solo Super Admin, igual que Branding — es información
 * operativa de todo el negocio, no de una sucursal puntual.
 */
export default async function SaludPage() {
  try {
    await requireAdminUser(["super_admin"]);
  } catch {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Esta pantalla es solo para Super Admin.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [cronJobs, errorReports] = await Promise.all([
    getCronJobsHealth(supabase),
    getRecentErrorReports(supabase),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Salud del sistema</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Estado interno: cron jobs y errores recientes. Para monitoreo externo (uptime,
          alertas por correo/Slack), ver el runbook de lanzamiento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cron jobs</CardTitle>
          <CardDescription>
            Última ejecución registrada de cada tarea programada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {cronJobs.map((job) => (
              <li
                key={job.jobName}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-medium">{JOB_LABELS[job.jobName] ?? job.jobName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {job.lastRun
                      ? `Última corrida: ${new Date(job.lastRun.finishedAt).toLocaleString("es-VE")}${job.lastRun.success ? "" : " (falló)"}`
                      : "Nunca registró una corrida."}
                  </p>
                </div>
                <Badge variant={job.isStale ? "error" : "success"}>
                  {job.isStale ? "Atrasado / con errores" : "Al día"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Errores recientes</CardTitle>
          <CardDescription>
            {errorReports.length > 0
              ? `Últimos ${errorReports.length} errores capturados (servidor y cliente).`
              : "Errores capturados del servidor y del cliente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorReports.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sin errores registrados.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {errorReports.map((report) => (
                <li
                  key={report.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted">{report.scope}</Badge>
                    <span className="text-[var(--color-muted-foreground)]">
                      {new Date(report.createdAt).toLocaleString("es-VE")}
                    </span>
                  </div>
                  <p className="mt-1 break-words">{report.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
