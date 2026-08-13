-- Zoe Catalog — 0009: métodos de pago/entrega y contenido de marketing.
-- Nada de esto se hardcodea (regla permanente 4): pickup/delivery/envío,
-- métodos de pago, banners y secciones del Home son datos, no código.

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instructions text,
  active boolean not null default true,
  "order" integer not null default 0,
  store_ids uuid[] -- null = disponible en todas las sucursales
);

create table shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- 'pickup' | 'delivery' | 'carrier' (o nombres administrables)
  active boolean not null default true
);

create table shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  sectors text[] not null default '{}',
  cost_usd numeric(10, 2) not null default 0,
  active boolean not null default true
);

alter table orders
  add constraint orders_shipping_zone_id_fkey
  foreign key (shipping_zone_id) references shipping_zones (id) on delete set null;

alter table orders
  add constraint orders_payment_method_id_fkey
  foreign key (payment_method_id) references payment_methods (id) on delete set null;

create table shipping_carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- MRW, Zoom, Tealca... datos de configuración, nunca hardcodeados en código
  active boolean not null default true,
  notes text
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_desktop_url text,
  image_mobile_url text,
  headline text,
  copy text,
  cta_label text,
  cta_url text,
  position text not null default 'home', -- home | category | product...
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table home_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'hero', 'banner', 'categories', 'product_slider', 'collection',
    'image_text', 'cta', 'brands', 'features', 'testimonials',
    'instagram', 'stores'
  )),
  title text,
  subtitle text,
  config jsonb not null default '{}'::jsonb, -- selección manual o regla automática de productos
  "order" integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_home_sections_updated_at
  before update on home_sections
  for each row execute function set_updated_at();

-- Plantilla del mensaje de WhatsApp con placeholders controlados (sección
-- 17/108 del plan) — el admin edita el texto alrededor, nunca los datos.
create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_whatsapp_templates_updated_at
  before update on whatsapp_templates
  for each row execute function set_updated_at();
