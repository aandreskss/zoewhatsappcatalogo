-- Zoe Catalog — 0006: monedas, tasa BCV y reglas de precio.
-- Ver sección 15 del plan (decisión confirmada: tasa BCV automática con
-- adaptador + respaldo manual, USD y EUR, visualización dual por defecto).

create table currencies (
  code text primary key, -- 'USD' | 'VES' | 'EUR'
  symbol text not null,
  decimals smallint not null default 2,
  is_base boolean not null default false
);

create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency_pair text not null, -- 'USD/VES' | 'EUR/VES'
  rate numeric(18, 6) not null check (rate > 0),
  source text not null check (source in ('manual', 'dolarapi', 'pydolarve', 'bcvapi', 'otro')),
  is_automatic boolean not null default false,
  fetched_at timestamptz not null default now(),
  effective_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_exchange_rates_pair_effective
  on exchange_rates (currency_pair, effective_at desc);

-- Diagnóstico de la integración con el proveedor de tasa BCV (sección 15
-- del plan: "el dashboard siempre muestra cuándo fue la última actualización
-- exitosa"), separado de la tabla de tasas válidas para no mezclar ruido.
create table exchange_rate_fetch_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  success boolean not null,
  http_status integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_exchange_rate_fetch_logs_created_at on exchange_rate_fetch_logs (created_at desc);

create table price_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('percentage', 'fixed', 'fixed_price')),
  target_type text not null check (target_type in ('product', 'variant', 'category', 'collection')),
  target_id uuid not null,
  value numeric(10, 2) not null,
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_price_rules_target on price_rules (target_type, target_id) where active;

-- Historial de precios (sección 129 del brief original, capturado desde el
-- MVP aunque su UI de consulta pueda esperar a V1.1 — mucho más barato
-- registrar desde ya que reconstruir retroactivamente).
create table price_history (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  old_price_usd numeric(10, 2) not null,
  new_price_usd numeric(10, 2) not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index idx_price_history_variant on price_history (variant_id, changed_at desc);
