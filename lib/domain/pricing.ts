/**
 * Lógica de precios y conversión de moneda — funciones puras, sin imports
 * de Next.js ni de la base de datos, para poder testearlas de forma
 * aislada (sección 31/33 del plan). Ver sección 15 para el diseño
 * completo del sistema de monedas (USD base, tasa BCV automática +
 * respaldo manual, snapshot por pedido).
 */

export interface MoneyAmount {
  usd: number;
  ves: number | null;
}

/** Nunca usar floating point directo para dinero en operaciones encadenadas: se redondea explícitamente a centavos en cada paso. */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function convertUsdToVes(amountUsd: number, usdToVesRate: number): number {
  if (usdToVesRate <= 0) {
    throw new Error("La tasa de cambio debe ser mayor que cero");
  }
  return roundCurrency(amountUsd * usdToVesRate);
}

export function formatUsd(amountUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountUsd);
}

export function formatVes(amountVes: number): string {
  return (
    "Bs. " +
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountVes)
  );
}

export function formatDualPrice(amountUsd: number, usdToVesRate: number | null): string {
  if (!usdToVesRate) return formatUsd(amountUsd);
  return `${formatUsd(amountUsd)} · ${formatVes(convertUsdToVes(amountUsd, usdToVesRate))}`;
}

export interface CartLineForPricing {
  unitPriceUsd: number;
  quantity: number;
}

/**
 * Recalcula el subtotal desde cero a partir de precios que ya vienen de
 * la base de datos (nunca de lo que mandó el navegador) — regla
 * permanente: "los precios se calculan en servidor".
 */
export function calculateSubtotalUsd(lines: CartLineForPricing[]): number {
  return roundCurrency(
    lines.reduce(
      (sum, line) => sum + roundCurrency(line.unitPriceUsd * line.quantity),
      0,
    ),
  );
}

export function calculateTotalUsd(params: {
  subtotalUsd: number;
  discountUsd?: number;
  shippingEstimateUsd?: number;
}): number {
  const discount = params.discountUsd ?? 0;
  const shipping = params.shippingEstimateUsd ?? 0;
  return roundCurrency(Math.max(params.subtotalUsd - discount, 0) + shipping);
}
