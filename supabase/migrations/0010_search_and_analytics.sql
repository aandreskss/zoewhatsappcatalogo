-- Zoe Catalog — 0010: búsqueda, analítica interna e integraciones externas.
-- Sección 12/21/26 del plan.

create table search_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count integer not null default 0,
  session_id text,
  created_at timestamptz not null default now()
);

create index idx_search_logs_created_at on search_logs (created_at desc);
-- Búsquedas sin resultados es una de las métricas de negocio explícitas
-- del plan (sección 21/121): índice parcial para consultarlas rápido.
create index idx_search_logs_no_results on search_logs (created_at desc) where results_count = 0;

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null, -- generado en el cliente, deduplica reintentos
  event_type text not null check (event_type in (
    'page_view', 'view_product', 'search', 'filter_applied', 'view_category',
    'add_to_cart', 'remove_from_cart', 'begin_checkout', 'checkout_completed',
    'whatsapp_clicked', 'favorite_added'
  )),
  session_id text not null,
  customer_id uuid references customers (id) on delete set null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  created_at timestamptz not null default now()
);

create unique index idx_analytics_events_client_event_id on analytics_events (client_event_id);
create index idx_analytics_events_type_created on analytics_events (event_type, created_at desc);
create index idx_analytics_events_session on analytics_events (session_id);

-- IDs públicos de integraciones (GA4, Meta Pixel, etc.) + referencia a
-- dónde vive el secreto real — nunca el secreto en esta tabla en texto
-- plano (regla permanente 3/121: nunca exponer secretos, enmascarar tokens).
create table integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in (
    'ga4', 'gtm', 'meta_pixel', 'meta_capi', 'tiktok', 'google_ads', 'bcv_rate_provider'
  )),
  public_config jsonb not null default '{}'::jsonb,
  secret_ref text, -- nombre de la variable de entorno / secret manager, no el valor
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger set_integrations_updated_at
  before update on integrations
  for each row execute function set_updated_at();
