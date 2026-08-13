-- Zoe Catalog — datos semilla para desarrollo/staging (sección 126 del plan).
-- Idempotente: puede ejecutarse más de una vez sin duplicar filas.

-- ── Roles y permisos base ───────────────────────────────────────────────
insert into roles (name, description) values
  ('super_admin', 'Acceso total, incluida configuración del sistema y usuarios'),
  ('admin', 'Catálogo, pedidos, clientes, marketing'),
  ('inventory', 'Inventario y lectura de catálogo'),
  ('sales', 'Pedidos, clientes, WhatsApp')
on conflict (name) do nothing;

-- ── Empresa ──────────────────────────────────────────────────────────
insert into company (legal_name, trade_name, description, email, whatsapp_main, instagram, address)
select 'Zoe Shoes, C.A.', 'Zoe', 'Zapatería en Valencia, Venezuela.', 'contacto@zoeshoes.example',
       '+584120000000', '@zoeshoes', 'Valencia, Carabobo, Venezuela'
where not exists (select 1 from company);

-- ── Ajustes por defecto (sección 15/17 del plan, decisiones confirmadas) ─
insert into company_settings (key, value) values
  ('price_display_mode', '"both"'),
  ('ves_reference_currency', '"USD"'),
  ('whatsapp_routing_strategy', '"by_store"'),
  ('stock_visibility_mode', '"urgency_below_3"')
on conflict (key) do nothing;

-- ── Monedas ──────────────────────────────────────────────────────────
insert into currencies (code, symbol, decimals, is_base) values
  ('USD', '$', 2, true),
  ('VES', 'Bs.', 2, false),
  ('EUR', '€', 2, false)
on conflict (code) do nothing;

-- Tasa manual inicial de ejemplo — se reemplaza por la integración BCV
-- automática (Fase 6). Ajustar el valor antes de usar en un entorno real.
insert into exchange_rates (currency_pair, rate, source, is_automatic)
select 'USD/VES', 40.00, 'manual', false
where not exists (select 1 from exchange_rates where currency_pair = 'USD/VES');

insert into exchange_rates (currency_pair, rate, source, is_automatic)
select 'EUR/VES', 43.00, 'manual', false
where not exists (select 1 from exchange_rates where currency_pair = 'EUR/VES');

-- ── Sucursales (decisión confirmada: WhatsApp por sucursal) ─────────────
insert into stores (name, code, slug, address, city, state, phone, whatsapp, pickup_enabled, delivery_enabled)
select 'Zoe Centro', 'CENTRO', 'centro-valencia', 'Centro de Valencia, Carabobo', 'Valencia', 'Carabobo',
       '+584120000001', '+584120000001', true, true
where not exists (select 1 from stores where code = 'CENTRO');

insert into stores (name, code, slug, address, city, state, phone, whatsapp, pickup_enabled, delivery_enabled)
select 'Zoe Av. Bolívar', 'BOLIVAR', 'av-bolivar-valencia', 'Av. Bolívar, Valencia, Carabobo', 'Valencia', 'Carabobo',
       '+584120000002', '+584120000002', true, false
where not exists (select 1 from stores where code = 'BOLIVAR');

-- Horario demo: lunes(1) a sábado(6), 9am–6pm, domingo(0) cerrado, para
-- ambas sucursales.
insert into store_hours (store_id, day_of_week, opens_at, closes_at, closed)
select s.id, d.day, '09:00'::time, '18:00'::time, d.day = 0
from stores s
cross join (select generate_series(0, 6) as day) d
where not exists (
  select 1 from store_hours sh where sh.store_id = s.id and sh.day_of_week = d.day
);

-- ── Categorías demo ──────────────────────────────────────────────────
insert into categories (name, slug, "order") values
  ('Mujer', 'mujer', 1),
  ('Hombre', 'hombre', 2),
  ('Sneakers', 'sneakers', 3),
  ('Sandalias', 'sandalias', 4),
  ('Ofertas', 'ofertas', 5)
on conflict (slug) do nothing;

-- ── Marca demo ───────────────────────────────────────────────────────
insert into brands (name, slug) values ('Zoe Basics', 'zoe-basics')
on conflict (slug) do nothing;

-- ── Métodos de pago y entrega demo ──────────────────────────────────
insert into payment_methods (name, instructions, "order") values
  ('Pago móvil', 'Se coordina por WhatsApp al confirmar el pedido.', 1),
  ('Zelle', 'Se coordina por WhatsApp al confirmar el pedido.', 2),
  ('Efectivo', 'Pago contra entrega/retiro en tienda.', 3)
on conflict do nothing;

insert into shipping_methods (name) values ('pickup'), ('delivery'), ('shipping')
on conflict do nothing;

-- ── Plantilla de WhatsApp por defecto (sección 17/108 del plan) ────────
insert into whatsapp_templates (name, template, active)
select
  'Pedido estándar',
  E'Hola Zoe 👋\nQuiero realizar el siguiente pedido:\n\nPedido: #{{order_number}}\n\n{{items}}\n\nSubtotal: {{subtotal}}\nTotal: {{total}}\n\nEntrega: {{delivery_method}} — {{store}}\nNombre: {{customer_name}}\nMétodo de pago preferido: {{payment_method}}\n\n¿Podrían confirmarme disponibilidad y ayudarme a completar la compra?',
  true
where not exists (select 1 from whatsapp_templates);

-- ── Producto demo con variantes e inventario ────────────────────────
do $$
declare
  v_product_id uuid;
  v_category_id uuid;
  v_brand_id uuid;
  v_option_color uuid;
  v_option_size uuid;
  v_color_negro uuid;
  v_color_blanco uuid;
  v_size_38 uuid;
  v_size_39 uuid;
  v_variant_id uuid;
  v_store_centro uuid;
  v_store_bolivar uuid;
begin
  select id into v_category_id from categories where slug = 'sneakers';
  select id into v_brand_id from brands where slug = 'zoe-basics';
  select id into v_store_centro from stores where code = 'CENTRO';
  select id into v_store_bolivar from stores where code = 'BOLIVAR';

  if not exists (select 1 from products where slug = 'sneaker-clasico-zoe') then
    insert into products (name, slug, sku, brand_id, category_id, gender, description_short, description, status, is_new)
    values (
      'Sneaker Clásico Zoe', 'sneaker-clasico-zoe', 'ZOE-SNK-001', v_brand_id, v_category_id, 'mujer',
      'Sneaker cómodo para el día a día.',
      'Sneaker clásico, plantilla acolchada y suela antideslizante. Ideal para uso diario.',
      'published', true
    )
    returning id into v_product_id;

    insert into product_images (product_id, url, alt_text, "order", is_primary)
    values (v_product_id, 'https://placehold.co/800x800?text=Sneaker+Zoe', 'Sneaker Clásico Zoe', 0, true);

    insert into product_options (product_id, name, "order") values (v_product_id, 'Color', 0)
      returning id into v_option_color;
    insert into product_options (product_id, name, "order") values (v_product_id, 'Talla', 1)
      returning id into v_option_size;

    insert into product_option_values (option_id, value, extra, "order")
      values (v_option_color, 'Negro', '{"hex": "#111111"}'::jsonb, 0)
      returning id into v_color_negro;
    insert into product_option_values (option_id, value, extra, "order")
      values (v_option_color, 'Blanco', '{"hex": "#f5f5f5"}'::jsonb, 1)
      returning id into v_color_blanco;

    insert into product_option_values (option_id, value, "order")
      values (v_option_size, '38', 0) returning id into v_size_38;
    insert into product_option_values (option_id, value, "order")
      values (v_option_size, '39', 1) returning id into v_size_39;

    -- Variante Negro/38
    insert into product_variants (product_id, sku, price_usd, compare_at_price_usd)
      values (v_product_id, 'ZOE-SNK-001-NEG-38', 35.00, 42.00) returning id into v_variant_id;
    insert into variant_option_values (variant_id, option_value_id) values
      (v_variant_id, v_color_negro), (v_variant_id, v_size_38);
    insert into inventory (variant_id, store_id, quantity_on_hand) values
      (v_variant_id, v_store_centro, 4), (v_variant_id, v_store_bolivar, 0);

    -- Variante Negro/39
    insert into product_variants (product_id, sku, price_usd, compare_at_price_usd)
      values (v_product_id, 'ZOE-SNK-001-NEG-39', 35.00, 42.00) returning id into v_variant_id;
    insert into variant_option_values (variant_id, option_value_id) values
      (v_variant_id, v_color_negro), (v_variant_id, v_size_39);
    insert into inventory (variant_id, store_id, quantity_on_hand) values
      (v_variant_id, v_store_centro, 2), (v_variant_id, v_store_bolivar, 1);

    -- Variante Blanco/38
    insert into product_variants (product_id, sku, price_usd)
      values (v_product_id, 'ZOE-SNK-001-BLA-38', 35.00) returning id into v_variant_id;
    insert into variant_option_values (variant_id, option_value_id) values
      (v_variant_id, v_color_blanco), (v_variant_id, v_size_38);
    insert into inventory (variant_id, store_id, quantity_on_hand) values
      (v_variant_id, v_store_centro, 0), (v_variant_id, v_store_bolivar, 3);
  end if;
end $$;

-- ── Asignar rol super_admin a un usuario ya creado en Supabase Auth ─────
-- Este seed NO crea usuarios de Auth (eso se hace desde el dashboard de
-- Supabase o `supabase auth admin` con la service role — nunca a mano en
-- SQL). Una vez creado el usuario administrador, correr:
--
--   insert into user_roles (user_id, role_id)
--   select '<uuid-del-usuario>', id from roles where name = 'super_admin';
