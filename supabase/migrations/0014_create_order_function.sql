-- Zoe Catalog — 0014: creación atómica de pedidos.
--
-- Por qué una sola función SQL y no varias llamadas desde la app: si la
-- reserva de inventario falla para una talla (ver 0013), TODO lo demás
-- que ya se había insertado (el pedido, sus líneas) debe revertirse
-- también — nunca queremos un pedido "fantasma" sin stock reservado, ni
-- una reserva sin su pedido. Una única función `security definer` que
-- hace todo dentro de la misma transacción de Postgres es la única forma
-- de garantizar eso con `supabase-js` (que no expone transacciones
-- multi-sentencia desde el cliente). Se llama SOLO desde
-- `lib/domain/orders.ts` con la Service Role Key, después de que el
-- código de servidor ya validó cliente/precio/dirección.

create or replace function create_order(
  p_order jsonb,
  p_items jsonb,
  p_reservation_ttl_minutes integer default 20
)
returns table (
  id uuid,
  order_number text,
  public_access_token uuid,
  is_replay boolean -- true si ya existía un pedido con esta idempotency_key
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_idempotency_key uuid := (p_order ->> 'idempotency_key')::uuid;
  v_existing record;
  v_order_id uuid;
  v_order_number text;
  v_public_access_token uuid;
  v_reservation_items jsonb;
begin
  select o.id, o.order_number, o.public_access_token
    into v_existing
    from orders o
    where o.idempotency_key = v_idempotency_key;

  if found then
    return query select v_existing.id, v_existing.order_number, v_existing.public_access_token, true;
    return;
  end if;

  insert into orders (
    customer_id, store_id, status,
    subtotal_usd, discount_usd, shipping_estimate_usd, total_usd,
    exchange_rate_used, exchange_rate_currency_pair, exchange_rate_source,
    delivery_method, delivery_address_id, shipping_zone_id,
    payment_method_id, payment_notes, source, idempotency_key
  )
  values (
    (p_order ->> 'customer_id')::uuid,
    nullif(p_order ->> 'store_id', '')::uuid,
    'nuevo',
    (p_order ->> 'subtotal_usd')::numeric,
    coalesce((p_order ->> 'discount_usd')::numeric, 0),
    coalesce((p_order ->> 'shipping_estimate_usd')::numeric, 0),
    (p_order ->> 'total_usd')::numeric,
    nullif(p_order ->> 'exchange_rate_used', '')::numeric,
    nullif(p_order ->> 'exchange_rate_currency_pair', ''),
    nullif(p_order ->> 'exchange_rate_source', ''),
    p_order ->> 'delivery_method',
    nullif(p_order ->> 'delivery_address_id', '')::uuid,
    nullif(p_order ->> 'shipping_zone_id', '')::uuid,
    nullif(p_order ->> 'payment_method_id', '')::uuid,
    nullif(p_order ->> 'payment_notes', ''),
    coalesce(p_order -> 'source', '{}'::jsonb),
    v_idempotency_key
  )
  returning orders.id, orders.order_number, orders.public_access_token
    into v_order_id, v_order_number, v_public_access_token;

  insert into order_items (
    order_id, variant_id, product_name, sku, variant_label,
    unit_price_usd, discount_usd, quantity, subtotal_usd, image_url_snapshot
  )
  select
    v_order_id,
    nullif(item ->> 'variant_id', '')::uuid,
    item ->> 'product_name',
    item ->> 'sku',
    item ->> 'variant_label',
    (item ->> 'unit_price_usd')::numeric,
    coalesce((item ->> 'discount_usd')::numeric, 0),
    (item ->> 'quantity')::integer,
    (item ->> 'subtotal_usd')::numeric,
    nullif(item ->> 'image_url_snapshot', '')
  from jsonb_array_elements(p_items) as item;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (v_order_id, null, 'nuevo', null, 'Pedido registrado desde el checkout público');

  -- Reserva de stock (sección 14/51 del plan) — variant_id/store_id/quantity
  -- de cada línea. Si esto falla (talla agotada), toda la función revierte:
  -- ni el pedido ni sus líneas quedan creados.
  select jsonb_agg(jsonb_build_object(
    'variant_id', item ->> 'variant_id',
    'store_id', item ->> 'reservation_store_id',
    'quantity', (item ->> 'quantity')::integer
  ))
  into v_reservation_items
  from jsonb_array_elements(p_items) as item;

  perform reserve_inventory_for_order(v_order_id, v_reservation_items, p_reservation_ttl_minutes);

  return query select v_order_id, v_order_number, v_public_access_token, false;
end;
$$;
