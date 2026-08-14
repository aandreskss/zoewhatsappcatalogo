import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusBadgeVariant } from "@/lib/domain/order-status";

/** `StatusBadge` de pedido (sección 29 del plan) — envoltorio fino sobre `Badge` con el mapeo de `lib/domain/order-status.ts`. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={orderStatusBadgeVariant(status)}>{orderStatusLabel(status)}</Badge>
  );
}
