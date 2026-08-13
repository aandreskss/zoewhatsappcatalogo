-- Zoe Catalog — 0008: pedidos. El módulo más sensible del sistema.
-- Ver secciones 16/17/18/23/46 del plan: nada de esto se crea sin que el
-- servidor haya recalculado precio/stock, todo es idempotente, el ID
-- humano nunca es una credencial, y la tasa de cambio y los datos del
-- producto quedan congelados (snapshot) en cada línea.

create table order_number_sequences (
  year integer primary key,
  last_value integer not null default 0
);

-- Genera 'ZOE-2026-000154' de forma atómica incluso con alta concurrencia:
-- el UPDATE ... RETURNING toma un lock de fila implícito en Postgres, así
-- que dos pedidos simultáneos nunca reciben el mismo número.
create or replace function next_order_number()
returns text
language plpgsql
as $$
declare
  current_year integer := extract(year from now());
  next_value integer;
begin
  insert into order_number_sequences (year, last_value)
  values (current_year, 0)
  on conflict (year) do nothing;

  update order_number_sequences
  set last_value = last_value + 1
  where year = current_year
  returning last_value into next_value;

  return 'ZOE-' || current_year || '-' || lpad(next_value::text, 6, '0');
end;
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default next_order_number(),
  -- UUID no adivinable: el order_number es secuencial y NUNCA debe servir
  -- como autorización para consultar el pedido públicamente (regla
  -- permanente + sección 23/48 del plan).
  public_access_token uuid not null default gen_random_uuid(),

  customer_id uuid not null references customers (id) on delete restrict,
  store_id uuid references stores (id) on delete set null, -- sucursal de retiro, si aplica

  status text not null default 'nuevo' check (status in (
    'nuevo', 'enviado_whatsapp', 'contactado', 'confirmado',
    'esperando_pago', 'pagado', 'preparando', 'listo_para_entregar',
    'enviado', 'entregado', 'cancelado'
  )),

  subtotal_usd numeric(10, 2) not null check (subtotal_usd >= 0),
  discount_usd numeric(10, 2) not null default 0 check (discount_usd >= 0),
  shipping_estimate_usd numeric(10, 2) not null default 0 check (shipping_estimate_usd >= 0),
  total_usd numeric(10, 2) not null check (total_usd >= 0),

  -- Snapshot de tasa (sección 15 del plan): un pedido nunca cambia de valor
  -- en Bs porque la tasa se actualizó después.
  exchange_rate_used numeric(18, 6),
  exchange_rate_currency_pair text,
  exchange_rate_source text,

  delivery_method text not null check (delivery_method in ('pickup', 'delivery', 'shipping')),
  delivery_address_id uuid references customer_addresses (id) on delete set null,
  shipping_zone_id uuid, -- FK real se agrega en 0009 tras crear shipping_zones

  payment_method_id uuid, -- FK real se agrega en 0009 tras crear payment_methods
  payment_notes text,

  -- Atribución de campaña (sección 32/41 del plan) — nunca se pierde entre
  -- el aterrizaje y la creación del pedido.
  source jsonb not null default '{}'::jsonb,

  -- Idempotencia (sección 16/36 del plan): un doble clic o un reintento de
  -- red nunca crea dos pedidos.
  idempotency_key uuid not null unique,

  whatsapp_number_used text,
  whatsapp_message_sent text,
  whatsapp_opened_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index idx_orders_customer on orders (customer_id, created_at desc);
create index idx_orders_status on orders (status);
create index idx_orders_created_at on orders (created_at desc);

alter table inventory_reservations
  add constraint inventory_reservations_order_id_fkey
  foreign key (order_id) references orders (id) on delete set null;

create index idx_inventory_reservations_order on inventory_reservations (order_id);

-- Snapshot completo de lo que se compró: si el producto cambia de nombre,
-- precio o se elimina mañana, esta línea sigue mostrando lo que ocurrió en
-- el momento del pedido (regla permanente 19 + sección 12 del plan).
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null, -- referencia, puede quedar null

  product_name text not null,
  sku text not null,
  variant_label text not null, -- ej. 'Negro / 38'
  unit_price_usd numeric(10, 2) not null check (unit_price_usd >= 0),
  discount_usd numeric(10, 2) not null default 0 check (discount_usd >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_usd numeric(10, 2) not null check (subtotal_usd >= 0),
  image_url_snapshot text,

  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users (id) on delete set null, -- null = 'system' (ej. liberación automática)
  note text,
  created_at timestamptz not null default now()
);

create index idx_order_status_history_order on order_status_history (order_id, created_at);

-- Notas internas (sección 18/58 del plan) — nunca visibles para el cliente.
create table order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index idx_order_notes_order on order_notes (order_id, created_at desc);
