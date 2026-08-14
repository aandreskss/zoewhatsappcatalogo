"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { changeOrderStatus } from "@/app/admin/(protected)/pedidos/actions";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/domain/order-status";

/**
 * Cambia el estado del pedido (sección 18/58 del plan). La confirmación
 * definitiva de inventario y la liberación de reservas por cancelación
 * viven en el servidor (`changeOrderStatus`) — este control nunca decide
 * eso, solo dispara la acción y refresca la vista.
 */
export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
          setError(null);
          startTransition(async () => {
            try {
              await changeOrderStatus(orderId, next);
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "No se pudo cambiar el estado",
              );
            }
          });
        }}
        className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm"
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
