-- Zoe Catalog — 0021: registro de errores para el panel de salud.
--
-- Sección 12 del plan (Fase 12: "logging estructurado" + panel de salud
-- con "errores recientes"). Complementa (no reemplaza) el logging por
-- consola/Vercel y la integración opcional de Sentry
-- (`lib/observability/error-reporting.ts`): esta tabla es lo que hace que
-- `/admin/salud` sea útil AUNQUE Sentry nunca se configure — el alcance
-- de Fase 12 acordado con el usuario es "solo la parte de código", sin
-- depender de una cuenta externa para tener visibilidad básica de
-- errores.
create table error_reports (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('public', 'admin', 'server')),
  message text not null,
  digest text,
  stack text,
  context jsonb,
  created_at timestamptz not null default now()
);

create index idx_error_reports_created_at on error_reports (created_at desc);

alter table error_reports enable row level security;

-- Mismo rol que el resto de tablas de auditoría/observabilidad
-- (`audit_logs`, `cron_job_runs`) — nunca la clave anon.
create policy "admin_read_error_reports" on error_reports
  for select using (auth_has_role(array['super_admin', 'admin']));
