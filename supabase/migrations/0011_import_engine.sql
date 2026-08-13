-- Zoe Catalog — 0011: motor de importación genérico por perfiles.
-- Fina (el sistema que Zoe usa hoy) es solo un perfil de mapeo, no una
-- dependencia del núcleo — ver sección 12/47 del plan.

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  profile text not null, -- 'fina' | 'csv_generic' | 'xlsx_generic' | ...
  file_name text not null,
  file_checksum text not null,
  status text not null default 'pending' check (status in ('pending', 'validated', 'applied', 'failed', 'rolled_back')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  dry_run boolean not null default true,
  applied_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

-- Idempotencia de importaciones (regla permanente 26): el mismo archivo
-- subido dos veces no debe duplicar nada.
create unique index idx_import_batches_checksum on import_batches (file_checksum);

create table import_row_results (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references import_batches (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  matched_entity_type text,
  matched_entity_id uuid,
  action text not null check (action in ('create', 'update', 'skip', 'error')),
  errors jsonb
);

create index idx_import_row_results_batch on import_row_results (batch_id);
