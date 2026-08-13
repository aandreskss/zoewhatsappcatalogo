-- Zoe Catalog — 0003: empresa, configuración y sucursales (sección 12, 36, 49 del plan)
--
-- Nada de esto se hardcodea en código: nombre de tiendas, WhatsApp,
-- horarios, etc. viven aquí y se editan desde /admin/empresa y
-- /admin/sucursales.

create table company (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  rif text,
  description text,
  email text,
  phone text,
  whatsapp_main text,
  instagram text,
  facebook text,
  tiktok text,
  website text,
  address text,
  google_maps_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_company_updated_at
  before update on company
  for each row execute function set_updated_at();

-- Ajustes no estructurales tipados en jsonb (visibilidad de stock,
-- estrategia de WhatsApp, moneda de referencia para VES, modo de
-- visualización de precio, etc. — sección 15/17/54 del plan) para poder
-- agregar configuración nueva sin migraciones constantes.
create table company_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger set_company_settings_updated_at
  before update on company_settings
  for each row execute function set_updated_at();

create table themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tokens jsonb not null default '{}'::jsonb,
  active_template text not null default 'minimal',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  slug text not null unique,
  address text,
  city text,
  state text,
  lat numeric(9, 6),
  lng numeric(9, 6),
  google_maps_url text,
  phone text,
  whatsapp text, -- número usado para pedidos con retiro en esta sucursal (sección 31 del plan, decidido)
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_stores_updated_at
  before update on stores
  for each row execute function set_updated_at();

create table store_hours (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = domingo
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  unique (store_id, day_of_week)
);

-- Ahora que `stores` existe, se completa la FK que 0002 dejó pendiente.
alter table user_roles
  add constraint user_roles_store_id_fkey
  foreign key (store_id) references stores (id) on delete cascade;
