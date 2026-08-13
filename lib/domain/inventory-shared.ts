/**
 * Parte pura de la lógica de inventario (sin DB, sin `server-only`) para
 * poder importarse desde componentes cliente como el selector de talla.
 * Las consultas reales a Postgres viven en `lib/domain/inventory.ts`.
 */

export interface VariantAvailability {
  variantId: string;
  storeId: string;
  available: number;
}

export type StockVisibilityMode = "exact" | "generic" | "urgency_below_3" | "hidden";

export function describeAvailability(
  totalAvailable: number,
  mode: StockVisibilityMode,
): { canPurchase: boolean; label: string } {
  if (totalAvailable <= 0) {
    return { canPurchase: false, label: "Agotado" };
  }

  switch (mode) {
    case "hidden":
      return { canPurchase: true, label: "Disponible" };
    case "exact":
      return { canPurchase: true, label: `${totalAvailable} disponibles` };
    case "urgency_below_3":
      return totalAvailable <= 3
        ? { canPurchase: true, label: `Últimas ${totalAvailable} unidades` }
        : { canPurchase: true, label: "Disponible" };
    case "generic":
    default:
      return { canPurchase: true, label: "Disponible" };
  }
}
