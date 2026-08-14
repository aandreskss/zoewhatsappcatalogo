export type CustomerSegment =
  | "vip"
  | "frecuente"
  | "regular"
  | "nuevo"
  | "en_riesgo"
  | "inactivo"
  | "sin_pedidos";

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  vip:         "VIP",
  frecuente:   "Frecuente",
  regular:     "Regular",
  nuevo:       "Nuevo",
  en_riesgo:   "En riesgo",
  inactivo:    "Inactivo",
  sin_pedidos: "Sin pedidos",
};

export type SegmentBadgeVariant = "default" | "accent" | "muted" | "success" | "warning" | "error";

export const CUSTOMER_SEGMENT_VARIANT: Record<CustomerSegment, SegmentBadgeVariant> = {
  vip:         "default",
  frecuente:   "success",
  regular:     "accent",
  nuevo:       "muted",
  en_riesgo:   "warning",
  inactivo:    "error",
  sin_pedidos: "muted",
};

export interface SegmentInput {
  orders_count:    number;
  total_spent_usd: number;
  last_order_at:   string | null;
  created_at:      string;
}

const DAY_MS = 86_400_000;

export function getCustomerSegment(c: SegmentInput): CustomerSegment {
  if (c.orders_count === 0) return "sin_pedidos";

  const now = Date.now();
  const lastOrderMs = c.last_order_at ? new Date(c.last_order_at).getTime() : 0;
  const daysSinceLast = (now - lastOrderMs) / DAY_MS;
  const daysSinceCreated = (now - new Date(c.created_at).getTime()) / DAY_MS;

  if (c.total_spent_usd >= 150 && c.orders_count >= 4) return "vip";
  if (daysSinceLast > 120) return "inactivo";
  if (daysSinceLast > 60 && c.orders_count >= 2) return "en_riesgo";
  if (c.orders_count >= 3) return "frecuente";
  if (c.orders_count >= 1 && daysSinceCreated <= 30) return "nuevo";
  return "regular";
}
