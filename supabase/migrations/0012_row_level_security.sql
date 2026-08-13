-- Zoe Catalog — 0012: Row Level Security.
--
-- Estrategia general (documentada aquí porque es una decisión de
-- arquitectura, no solo SQL — ver sección 10/23 del plan):
--
-- 1. La clave ANON (pública, en el navegador) SOLO puede LEER catálogo
--    publicado y configuración pública (tiendas, banners activos, métodos
--    de pago/entrega activos). No tiene ningún permiso de escritura.
-- 2. TODA escritura que origina el sitio público (carrito, pedidos,
--    favoritos, eventos de analítica, búsquedas) pasa por Route
--    Handlers/Server Actions que usan la Service Role Key
--    (`createSupabaseServiceRoleClient`), después de que el propio código
--    de servidor validó precio/stock/propiedad de la sesión — nunca
--    confiando en lo que mandó el navegador. La Service Role Key ignora
--    RLS por diseño, así que estas políticas no necesitan (ni deben)
--    modelar "un anónimo puede insertar en su propio carrito" con
--    políticas complejas basadas en session_id, que serían fáciles de
--    falsear con la clave anon.
-- 3. Los usuarios autenticados del admin (`authenticated` + rol en
--    `user_roles`) tienen políticas propias de lectura/escritura sobre las
--    tablas de gestión, como defensa en profundidad (capa 3 del modelo de
--    3 capas UI/API/DB) incluso cuando el código de servidor también use
--    la service role para esas mismas operaciones.

create or replace function auth_has_role(role_names text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any (role_names)
  );
$$;

comment on function auth_has_role(text[]) is
  'Helper de RLS: ¿el usuario autenticado tiene alguno de estos roles? Nunca confiar en un rol que venga del cliente.';

-- ── Activar RLS en todo el esquema de negocio ──────────────────────────
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table audit_logs enable row level security;
alter table company enable row level security;
alter table company_settings enable row level security;
alter table themes enable row level security;
alter table stores enable row level security;
alter table store_hours enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table variant_option_values enable row level security;
alter table variant_images enable row level security;
alter table size_charts enable row level security;
alter table redirects enable row level security;
alter table inventory enable row level security;
alter table inventory_reservations enable row level security;
alter table inventory_movements enable row level security;
alter table stock_transfers enable row level security;
alter table restock_notifications enable row level security;
alter table currencies enable row level security;
alter table exchange_rates enable row level security;
alter table exchange_rate_fetch_logs enable row level security;
alter table price_rules enable row level security;
alter table price_history enable row level security;
alter table customers enable row level security;
alter table customer_addresses enable row level security;
alter table favorites enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table order_notes enable row level security;
alter table payment_methods enable row level security;
alter table shipping_methods enable row level security;
alter table shipping_zones enable row level security;
alter table shipping_carriers enable row level security;
alter table banners enable row level security;
alter table home_sections enable row level security;
alter table whatsapp_templates enable row level security;
alter table search_logs enable row level security;
alter table analytics_events enable row level security;
alter table integrations enable row level security;
alter table import_batches enable row level security;
alter table import_row_results enable row level security;

-- ── Lectura pública de catálogo/config publicados (anon + authenticated) ─

create policy "public_read_brands_active" on brands
  for select using (active = true);

create policy "public_read_categories_active" on categories
  for select using (active = true);

create policy "public_read_collections_active" on collections
  for select using (active = true);

create policy "public_read_products_published" on products
  for select using (status = 'published' and deleted_at is null);

create policy "public_read_product_images" on product_images
  for select using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and p.status = 'published' and p.deleted_at is null
    )
  );

create policy "public_read_product_options" on product_options
  for select using (
    exists (
      select 1 from products p
      where p.id = product_options.product_id
        and p.status = 'published' and p.deleted_at is null
    )
  );

create policy "public_read_product_option_values" on product_option_values
  for select using (
    exists (
      select 1 from product_options po
      join products p on p.id = po.product_id
      where po.id = product_option_values.option_id
        and p.status = 'published' and p.deleted_at is null
    )
  );

create policy "public_read_product_variants_active" on product_variants
  for select using (
    status = 'active'
    and exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and p.status = 'published' and p.deleted_at is null
    )
  );

create policy "public_read_variant_option_values" on variant_option_values
  for select using (true);

create policy "public_read_variant_images" on variant_images
  for select using (true);

create policy "public_read_size_charts" on size_charts
  for select using (true);

create policy "public_read_stores_active" on stores
  for select using (active = true);

create policy "public_read_store_hours" on store_hours
  for select using (
    exists (select 1 from stores s where s.id = store_hours.store_id and s.active = true)
  );

create policy "public_read_banners_active" on banners
  for select using (active = true);

create policy "public_read_home_sections_active" on home_sections
  for select using (active = true);

create policy "public_read_payment_methods_active" on payment_methods
  for select using (active = true);

create policy "public_read_shipping_zones_active" on shipping_zones
  for select using (active = true);

create policy "public_read_shipping_methods_active" on shipping_methods
  for select using (active = true);

create policy "public_read_currencies" on currencies
  for select using (true);

-- Nota: `orders` NO tiene policy de SELECT para anon/authenticated sin rol
-- administrativo. La página pública de confirmación de pedido
-- (`/checkout/confirmacion`) se sirve desde un Route Handler que usa la
-- Service Role Key y valida `public_access_token` en código de aplicación
-- (nunca por `order_number`, que es predecible) — no a través de una
-- policy de RLS con la clave anon. Ver lib/domain/orders.ts.

-- Disponibilidad calculada (nunca se expone la tabla `inventory` cruda al
-- público — sección 14/17 del plan). El nivel de detalle que ve el
-- cliente (cantidad exacta / "disponible" / urgencia / oculto) lo decide
-- la capa de aplicación a partir de `company_settings`, no esta vista.
create or replace view variant_availability as
select
  i.variant_id,
  i.store_id,
  i.quantity_on_hand - coalesce((
    select sum(r.quantity)
    from inventory_reservations r
    where r.variant_id = i.variant_id
      and r.store_id = i.store_id
      and r.status = 'active'
  ), 0) as available
from inventory i;

grant select on variant_availability to anon, authenticated;

-- ── Perfil propio ────────────────────────────────────────────────────
create policy "read_own_profile" on profiles
  for select using (id = auth.uid());

create policy "update_own_profile" on profiles
  for update using (id = auth.uid());

create policy "admins_read_all_profiles" on profiles
  for select using (auth_has_role(array['super_admin', 'admin']));

-- ── Administración: catálogo, inventario, pedidos, config ──────────────
-- Patrón repetido: los roles con permiso de gestión leen/escriben; el
-- resto de roles (ej. 'sales' sobre catálogo) solo hereda la lectura
-- pública ya otorgada arriba. Esto es intencionalmente uniforme para que
-- extenderlo a una tabla nueva sea mecánico.

create policy "admin_manage_products" on products
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_product_images" on product_images
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_product_options" on product_options
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_product_option_values" on product_option_values
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_product_variants" on product_variants
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_variant_option_values" on variant_option_values
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_variant_images" on variant_images
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_brands" on brands
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_categories" on categories
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_collections" on collections
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_collection_products" on collection_products
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_size_charts" on size_charts
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_redirects" on redirects
  for select using (auth_has_role(array['super_admin', 'admin']));

-- Inventario: 'inventory' además de 'super_admin'/'admin' puede gestionar.
create policy "inventory_roles_manage_inventory" on inventory
  for all using (auth_has_role(array['super_admin', 'admin', 'inventory']))
  with check (auth_has_role(array['super_admin', 'admin', 'inventory']));

create policy "inventory_roles_read_reservations" on inventory_reservations
  for select using (auth_has_role(array['super_admin', 'admin', 'inventory', 'sales']));

create policy "inventory_roles_manage_movements" on inventory_movements
  for all using (auth_has_role(array['super_admin', 'admin', 'inventory']))
  with check (auth_has_role(array['super_admin', 'admin', 'inventory']));

create policy "inventory_roles_manage_transfers" on stock_transfers
  for all using (auth_has_role(array['super_admin', 'admin', 'inventory']))
  with check (auth_has_role(array['super_admin', 'admin', 'inventory']));

create policy "admin_read_restock_notifications" on restock_notifications
  for select using (auth_has_role(array['super_admin', 'admin', 'inventory']));

-- Finanzas: precio y tasa solo 'super_admin'/'admin'.
create policy "admin_manage_exchange_rates" on exchange_rates
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_exchange_rate_fetch_logs" on exchange_rate_fetch_logs
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_price_rules" on price_rules
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_price_history" on price_history
  for select using (auth_has_role(array['super_admin', 'admin']));

-- Ventas/pedidos: 'sales' gestiona pedidos y clientes, no precios base ni catálogo.
create policy "sales_roles_manage_orders" on orders
  for all using (auth_has_role(array['super_admin', 'admin', 'sales']))
  with check (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "sales_roles_read_order_items" on order_items
  for select using (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "sales_roles_manage_order_status_history" on order_status_history
  for all using (auth_has_role(array['super_admin', 'admin', 'sales']))
  with check (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "sales_roles_manage_order_notes" on order_notes
  for all using (auth_has_role(array['super_admin', 'admin', 'sales']))
  with check (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "sales_roles_manage_customers" on customers
  for all using (auth_has_role(array['super_admin', 'admin', 'sales']))
  with check (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "sales_roles_manage_customer_addresses" on customer_addresses
  for all using (auth_has_role(array['super_admin', 'admin', 'sales']))
  with check (auth_has_role(array['super_admin', 'admin', 'sales']));

create policy "admin_read_favorites" on favorites
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_carts" on carts
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_cart_items" on cart_items
  for select using (auth_has_role(array['super_admin', 'admin']));

-- Marketing / configuración comercial: 'super_admin'/'admin'.
create policy "admin_manage_payment_methods" on payment_methods
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_shipping_methods" on shipping_methods
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_shipping_zones" on shipping_zones
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_shipping_carriers" on shipping_carriers
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_banners" on banners
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_home_sections" on home_sections
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_whatsapp_templates" on whatsapp_templates
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

-- Empresa / sucursales / sistema: solo 'super_admin' escribe; 'admin' solo lee.
create policy "admin_read_company" on company
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "super_admin_manage_company" on company
  for insert with check (auth_has_role(array['super_admin']));

create policy "super_admin_update_company" on company
  for update using (auth_has_role(array['super_admin']));

create policy "admin_read_company_settings" on company_settings
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "super_admin_manage_company_settings" on company_settings
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "admin_read_themes" on themes
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "super_admin_manage_themes" on themes
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "admin_manage_stores" on stores
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

create policy "admin_manage_store_hours" on store_hours
  for all using (auth_has_role(array['super_admin', 'admin']))
  with check (auth_has_role(array['super_admin', 'admin']));

-- Sistema: usuarios/roles/permisos/integraciones/logs — solo super_admin.
create policy "super_admin_manage_user_roles" on user_roles
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "authenticated_read_roles" on roles
  for select using (auth.uid() is not null);

create policy "super_admin_manage_roles" on roles
  for insert with check (auth_has_role(array['super_admin']));

create policy "super_admin_update_roles" on roles
  for update using (auth_has_role(array['super_admin']));

create policy "authenticated_read_permissions" on permissions
  for select using (auth.uid() is not null);

create policy "super_admin_manage_permissions" on permissions
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "authenticated_read_role_permissions" on role_permissions
  for select using (auth.uid() is not null);

create policy "super_admin_manage_role_permissions" on role_permissions
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "admin_read_audit_logs" on audit_logs
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "super_admin_manage_integrations" on integrations
  for all using (auth_has_role(array['super_admin']))
  with check (auth_has_role(array['super_admin']));

create policy "admin_read_import_batches" on import_batches
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_import_row_results" on import_row_results
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_search_logs" on search_logs
  for select using (auth_has_role(array['super_admin', 'admin']));

create policy "admin_read_analytics_events" on analytics_events
  for select using (auth_has_role(array['super_admin', 'admin']));

-- No se agrega ninguna policy de INSERT/UPDATE/DELETE para anon en
-- carts/cart_items/orders/order_items/favorites/analytics_events/
-- search_logs a propósito: esas escrituras las hace el servidor con la
-- Service Role Key después de validar todo (ver el comentario al inicio
-- de este archivo). Sin una policy que lo permita, RLS deniega por
-- defecto — es el comportamiento correcto aquí, no un olvido.
