-- Zoe Catalog — 0013: funciones transaccionales del dominio de pedidos.
--
-- Por qué en SQL y no en la app (sección 14/28 del plan + regla permanente
-- "integridad transaccional de inventario"): el caso de dos clientes
-- comprando la última talla 38 al mismo tiempo solo se resuelve de forma
-- confiable con un lock de fila (`SELECT ... FOR UPDATE`) dentro de UNA
-- transacción de base de datos. Hacerlo con múltiples llamadas separadas
-- desde `supabase-js` no da esa garantía. Estas funciones son
-- `security definer` y solo se invocan desde `lib/domain/orders.ts` con la
-- Service Role Key, nunca directamente desde el cliente.

-- Reserva TODAS las líneas de un pedido en una sola transacción atómica:
-- si una sola línea no tiene stock suficiente, la función entera falla y
-- Postgres revierte cualquier inserción parcial (ninguna reserva a medias).
create or replace function reserve_inventory_for_order(
  p_order_id uuid,
  p_items jsonb, -- [{"variant_id": "...", "store_id": "...", "quantity": 1}, ...]
  p_ttl_minutes integer default 20
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  v_on_hand integer;
  v_reserved integer;
  v_available integer;
begin
  for item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, store_id uuid, quantity integer)
  loop
    -- Lock de fila: si dos pedidos piden la misma variante/tienda al mismo
    -- tiempo, el segundo espera aquí hasta que el primero confirme o falle.
    select quantity_on_hand into v_on_hand
    from inventory
    where variant_id = item.variant_id and store_id = item.store_id
    for update;

    if not found then
      raise exception 'NO_INVENTORY_ROW: variant % en tienda % no tiene registro de inventario', item.variant_id, item.store_id
        using errcode = 'P0001';
    end if;

    select coalesce(sum(quantity), 0) into v_reserved
    from inventory_reservations
    where variant_id = item.variant_id
      and store_id = item.store_id
      and status = 'active';

    v_available := v_on_hand - v_reserved;

    if v_available < item.quantity then
      raise exception 'INSUFFICIENT_STOCK: variant % en tienda % — disponible %, solicitado %',
        item.variant_id, item.store_id, v_available, item.quantity
        using errcode = 'P0001';
    end if;

    insert into inventory_reservations (variant_id, store_id, order_id, quantity, status, expires_at)
    values (item.variant_id, item.store_id, p_order_id, item.quantity, 'active', now() + make_interval(mins => p_ttl_minutes));
  end loop;
end;
$$;

-- Job programado (ver app/api/cron/release-reservations): libera reservas
-- vencidas que nunca se confirmaron. No toca `quantity_on_hand` porque la
-- reserva nunca lo decrementó — solo deja de contar contra la disponibilidad.
create or replace function release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update inventory_reservations
  set status = 'released'
  where status = 'active'
    and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Se llama cuando el admin confirma un pedido (estado 'confirmado' o
-- 'pagado' por primera vez): convierte las reservas activas del pedido en
-- una salida de inventario definitiva (sección 14 del plan).
create or replace function confirm_order_inventory(p_order_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_on_hand integer;
begin
  for r in
    select * from inventory_reservations
    where order_id = p_order_id and status = 'active'
    for update
  loop
    select quantity_on_hand into v_on_hand
    from inventory
    where variant_id = r.variant_id and store_id = r.store_id
    for update;

    update inventory
    set quantity_on_hand = greatest(v_on_hand - r.quantity, 0)
    where variant_id = r.variant_id and store_id = r.store_id;

    insert into inventory_movements (
      variant_id, store_id, type, quantity_delta, reason,
      reference_order_id, user_id, previous_quantity, new_quantity
    ) values (
      r.variant_id, r.store_id, 'venta', -r.quantity, 'Confirmación de pedido',
      p_order_id, p_user_id, v_on_hand, greatest(v_on_hand - r.quantity, 0)
    );

    update inventory_reservations set status = 'converted' where id = r.id;
  end loop;
end;
$$;

-- Se llama al cancelar un pedido antes de que sus reservas se hayan
-- convertido: libera el stock reservado de inmediato en vez de esperar a
-- que expire solo.
create or replace function release_order_reservations(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update inventory_reservations
  set status = 'released'
  where order_id = p_order_id and status = 'active';
end;
$$;
