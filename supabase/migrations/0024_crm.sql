-- CRM: etiquetas de clientes, notas a nivel de cliente
-- Las etiquetas son manuales (admin las asigna). El segmento (VIP, etc.)
-- se calcula en código a partir de orders_count / total_spent / last_order_at
-- para no duplicar lógica de negocio en la DB.

-- ─────────────────────────────────────────────
-- Definición de etiquetas
-- ─────────────────────────────────────────────
create table if not exists customer_tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#6b7280',   -- hex, para el badge
  description text,
  created_at  timestamptz not null default now(),
  unique (name)
);

-- Algunas etiquetas de arranque
insert into customer_tags (name, color, description) values
  ('Mayorista',   '#7c3aed', 'Cliente que compra al por mayor'),
  ('Revendedora', '#0891b2', 'Revende productos de Zoe'),
  ('VIP manual',  '#d97706', 'Marcado manualmente como cliente VIP'),
  ('Con problema','#dc2626', 'Tuvo un inconveniente con un pedido'),
  ('Devolución',  '#9333ea', 'Realizó al menos una devolución')
on conflict (name) do nothing;

-- ─────────────────────────────────────────────
-- Asignación etiqueta ↔ cliente (N:M)
-- ─────────────────────────────────────────────
create table if not exists customer_tag_assignments (
  customer_id uuid not null references customers (id) on delete cascade,
  tag_id      uuid not null references customer_tags (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id) on delete set null,
  primary key (customer_id, tag_id)
);

create index if not exists idx_cta_customer on customer_tag_assignments (customer_id);
create index if not exists idx_cta_tag      on customer_tag_assignments (tag_id);

-- ─────────────────────────────────────────────
-- Notas a nivel de cliente (distintas de order_notes)
-- ─────────────────────────────────────────────
create table if not exists customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  note        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_customer_notes_customer on customer_notes (customer_id);

-- ─────────────────────────────────────────────
-- RLS: las tres tablas solo son legibles/modificables por usuarios
-- autenticados con rol de staff (admin, sales, super_admin). No se
-- exponen al anon/cliente público.
-- ─────────────────────────────────────────────
alter table customer_tags            enable row level security;
alter table customer_tag_assignments enable row level security;
alter table customer_notes           enable row level security;

-- service_role lo puede todo (operaciones server-side con service key)
create policy "service_role_all_tags"
  on customer_tags for all
  using (auth.role() = 'service_role');

create policy "service_role_all_assignments"
  on customer_tag_assignments for all
  using (auth.role() = 'service_role');

create policy "service_role_all_customer_notes"
  on customer_notes for all
  using (auth.role() = 'service_role');

-- autenticados: lectura de etiquetas disponibles (para el selector)
create policy "auth_read_tags"
  on customer_tags for select
  using (auth.role() = 'authenticated');

-- autenticados: leer y escribir asignaciones y notas
create policy "auth_manage_assignments"
  on customer_tag_assignments for all
  using (auth.role() = 'authenticated');

create policy "auth_manage_customer_notes"
  on customer_notes for all
  using (auth.role() = 'authenticated');
