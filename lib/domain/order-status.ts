/**
 * Único lugar con la lista de estados de pedido, sus etiquetas en español
 * y su color de badge (sección 18/29/58 del plan — "StatusBadge
 * configurable por estado de pedido"). Antes vivía duplicado en
 * `admin/pedidos/page.tsx`, `admin/pedidos/[id]/page.tsx` y
 * `order-status-select.tsx` — un estado nuevo requería tocar los tres.
 * Módulo puro (sin `server-only`) para poder importarse desde Client
 * Components como `OrderStatusSelect`.
 */
export const ORDER_STATUSES = [
  "nuevo",
  "enviado_whatsapp",
  "contactado",
  "confirmado",
  "esperando_pago",
  "pagado",
  "preparando",
  "listo_para_entregar",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  enviado_whatsapp: "Enviado a WhatsApp",
  contactado: "Contactado",
  confirmado: "Confirmado",
  esperando_pago: "Esperando pago",
  pagado: "Pagado",
  preparando: "Preparando",
  listo_para_entregar: "Listo para entregar",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

/** Variante de `Badge` por estado — agrupa estados afines en vez de un color distinto por cada uno de los 11. */
export function orderStatusBadgeVariant(
  status: string,
): "muted" | "warning" | "success" | "error" {
  switch (status) {
    case "cancelado":
      return "error";
    case "pagado":
    case "confirmado":
    case "entregado":
      return "success";
    case "nuevo":
      return "muted";
    default:
      return "warning";
  }
}
