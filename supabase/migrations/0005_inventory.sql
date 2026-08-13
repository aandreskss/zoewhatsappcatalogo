-- Zoe Catalog — 0005: inventario por sucursal, reservas y movimientos.
-- Ver sección 14 del plan: Product → Variant → Location(Store) → Stock,
-- con `available = quantity_on_hand - reservas_activas`, nunca stock
-- negativo sin una razón deliberada, y todo movimiento auditado.

create table inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  store_id uuid not null references stores (id) on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_id, store_id)
);

create trigger set_inventory_updated_at
  before update on inventory
  for each row execute function set_updated_at();

create index idx_inventory_variant on inventory (variant_id);
create index idx_inventory_store on inventory (store_id);

-- Reserva temporal creada SOLO al registrar un pedido (nunca por estar en
-- el carrito — sección 14/51 del plan). Un job libera las vencidas
-- (ver scripts/release-expired-reservations).
create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  store_id uuid not null references stores (id) on delete cascade,
  order_id uuid, -- FK real se agrega en 0008 tras crear `orders`
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'converted', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_reservations_variant_store_active
  on inventory_reservations (variant_id, store_id)
  where status = 'active';

create index idx_reservations_expiring
  on inventory_reservations (expires_at)
  where status = 'active';

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  store_id uuid not null references stores (id) on delete cascade,
  type text not null check (type in ('entrada', 'salida', 'ajuste', 'transferencia', 'venta', 'liberacion')),
  quantity_delta integer not null, -- positivo o negativo
  reason text,
  reference_order_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  previous_quantity integer not null,
  new_quantity integer not null,
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_variant_store
  on inventory_movements (variant_id, store_id, created_at desc);

create table stock_transfers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  from_store_id uuid not null references stores (id) on delete restrict,
  to_store_id uuid not null references stores (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  requested_by uuid references auth.users (id) on delete set null,
  received_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (from_store_id <> to_store_id)
);

-- "Avísame cuando esté disponible" (V1.1, modelo listo desde ahora).
create table restock_notifications (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  store_id uuid references stores (id) on delete cascade,
  customer_phone text,
  customer_email text,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
