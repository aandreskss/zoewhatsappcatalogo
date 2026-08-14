-- Zoe Catalog — 0020: registro de ejecuciones de cron jobs.
--
-- Sección 12/23 del plan (Fase 12: observabilidad). Vercel Cron no expone
-- un dashboard de "¿corrió el job de hoy?" fuera de los logs de
-- despliegue — sin esta tabla, el panel de salud del admin
-- (`/admin/salud`) no tiene forma de detectar un cron job que dejó de
-- correr silenciosamente (ej. `CRON_SECRET` rotado sin actualizar Vercel,
-- el job desactivado por error, o el proveedor de tasas caído varios
-- días seguidos). Genérica por `job_name` a propósito, para no tener que
-- migrar de nuevo cuando se agregue un tercer cron job.
--
-- No reemplaza a `exchange_rate_fetch_logs` (0006): esa tabla ya
-- registra el detalle por-proveedor de cada intento de tasa de cambio y
-- se deja tal cual. Esta tabla es el resumen por-job que el panel de
-- salud puede consultar de forma uniforme para CUALQUIER cron, incluidos
-- los que no tienen (ni necesitan) su propia tabla de detalle.
create table cron_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  success boolean not null,
  detail jsonb,
  started_at timestamptz not null,
  finished_at timestamptz not null default now()
);

create index idx_cron_job_runs_job_name_finished_at on cron_job_runs (job_name, finished_at desc);

alter table cron_job_runs enable row level security;

-- Mismo rol que ya puede leer `exchange_rate_fetch_logs`/`audit_logs`:
-- super_admin y admin, nunca la clave anon. Los propios cron jobs
-- escriben con la service role key (saltándose RLS, como todo el resto
-- del código de cron), así que esta policy es solo para la lectura desde
-- el panel de salud.
create policy "admin_read_cron_job_runs" on cron_job_runs
  for select using (auth_has_role(array['super_admin', 'admin']));
