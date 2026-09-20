-- Agrega soft-delete a pedidos y función atómica de eliminación con
-- restauración de inventario.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders (deleted_at);

-- -----------------------------------------------------------------------
-- delete_order_with_restoration(p_order_id, p_user_id)
--
-- Elimina un pedido de forma segura:
--   • Reservas 'active'   → se marcan 'released' (stock nunca descontó)
--   • Reservas 'converted' → se restaura quantity_on_hand y se registra
--     un movimiento de 'liberacion' en inventory_movements
--   • El pedido recibe deleted_at = now() (soft-delete)
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_order_with_restoration(
  p_order_id uuid,
  p_user_id  uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order      orders%ROWTYPE;
  v_res        inventory_reservations%ROWTYPE;
  v_on_hand    integer;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_order.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Este pedido ya fue eliminado';
  END IF;

  FOR v_res IN
    SELECT * FROM inventory_reservations
    WHERE order_id = p_order_id
    FOR UPDATE
  LOOP
    IF v_res.status = 'active' THEN
      -- Stock nunca se decrementó; solo liberar la reserva.
      UPDATE inventory_reservations
      SET status = 'released'
      WHERE id = v_res.id;

    ELSIF v_res.status = 'converted' THEN
      -- Stock sí se decrementó al confirmar el pedido; hay que restaurarlo.
      SELECT quantity_on_hand INTO v_on_hand
      FROM inventory
      WHERE variant_id = v_res.variant_id
        AND store_id   = v_res.store_id
      FOR UPDATE;

      IF FOUND THEN
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand + v_res.quantity,
            updated_at       = now()
        WHERE variant_id = v_res.variant_id
          AND store_id   = v_res.store_id;

        INSERT INTO inventory_movements (
          variant_id, store_id, type, quantity_delta,
          reason, reference_order_id, user_id,
          previous_quantity, new_quantity
        ) VALUES (
          v_res.variant_id,
          v_res.store_id,
          'liberacion',
          v_res.quantity,
          'Pedido eliminado por administrador',
          p_order_id,
          p_user_id,
          v_on_hand,
          v_on_hand + v_res.quantity
        );
      END IF;

      UPDATE inventory_reservations
      SET status = 'released'
      WHERE id = v_res.id;
    END IF;
  END LOOP;

  UPDATE orders SET deleted_at = now() WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_order_with_restoration(uuid, uuid) TO authenticated;
