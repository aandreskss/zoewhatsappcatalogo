-- Zoe Catalog — 0002: identidad, roles y permisos (sección 12 y 20 del plan)
--
-- Los usuarios administrativos viven en `auth.users` (Supabase Auth) — este
-- proyecto no reimplementa autenticación/hashing de contraseñas a mano.
-- `profiles` guarda los datos propios del negocio que Auth no tiene.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Crea automáticamente el profile cuando Supabase Auth crea el usuario, para
-- no depender de que el código de aplicación se acuerde de hacerlo.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- super_admin | admin | inventory | sales (semilla en seed.sql)
  description text
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- ej. 'products.edit', 'orders.change_status'
  description text
);

create table role_permissions (
  role_id uuid not null references roles (id) on delete cascade,
  permission_id uuid not null references permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- store_id nullable = el usuario puede operar en todas las sucursales.
create table user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references roles (id) on delete restrict,
  store_id uuid, -- FK real a stores se agrega en 0003 (evita dependencia circular de archivos)
  created_at timestamptz not null default now(),
  primary key (user_id, role_id, store_id)
);

create index idx_user_roles_user_id on user_roles (user_id);

-- Auditoría de acciones administrativas (regla permanente 60/77): quién
-- cambió qué, cuándo, y con qué valores antes/después.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,       -- ej. 'product.price_changed'
  entity_type text not null,  -- ej. 'product'
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs (entity_type, entity_id);
create index idx_audit_logs_created_at on audit_logs (created_at desc);
