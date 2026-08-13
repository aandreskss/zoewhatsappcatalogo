-- Zoe Catalog — 0007: clientes, direcciones, favoritos y carrito.
-- Checkout sin cuenta obligatoria (guest) — sección 16/113 del plan.

create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  phone text not null, -- normalizado E.164 en la capa de aplicación antes de guardar
  whatsapp_phone text,
  email text,
  city text,
  state text,
  address text,
  source jsonb, -- UTMs de la primera captación
  first_order_at timestamptz,
  last_order_at timestamptz,
  orders_count integer not null default 0,
  total_spent_usd numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger set_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- Único por teléfono normalizado entre clientes no borrados: evita crear un
-- cliente nuevo por cada pedido de la misma persona.
create unique index idx_customers_phone_active
  on customers (phone)
  where deleted_at is null;

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label text,
  state text,
  city text,
  municipality text,
  address text not null,
  reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_customer_addresses_customer on customer_addresses (customer_id);

-- Favoritos anónimos (por session_id, sin cuenta) o de cliente ya
-- identificado — sección 21 del plan.
create table favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade,
  session_id text,
  product_id uuid references products (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (customer_id is not null or session_id is not null),
  check (product_id is not null or variant_id is not null)
);

create index idx_favorites_session on favorites (session_id);
create index idx_favorites_customer on favorites (customer_id);

create table carts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  customer_id uuid references customers (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_carts_updated_at
  before update on carts
  for each row execute function set_updated_at();

create unique index idx_carts_session_active
  on carts (session_id)
  where status = 'active';

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  variant_id uuid not null references product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot_usd numeric(10, 2) not null, -- solo referencial, SIEMPRE se recalcula en checkout
  added_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index idx_cart_items_cart on cart_items (cart_id);
