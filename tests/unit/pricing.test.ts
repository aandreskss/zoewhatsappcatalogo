import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  convertUsdToVes,
  formatUsd,
  formatDualPrice,
  calculateSubtotalUsd,
  calculateTotalUsd,
} from "@/lib/domain/pricing";

describe("roundCurrency", () => {
  it("redondea a 2 decimales", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(19.999999)).toBe(20);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3); // el caso clásico de floating point
  });
});

describe("convertUsdToVes", () => {
  it("convierte al redondear a centavos", () => {
    expect(convertUsdToVes(10, 40)).toBe(400);
    expect(convertUsdToVes(10.5, 36.789)).toBeCloseTo(386.28, 2);
  });

  it("rechaza una tasa <= 0", () => {
    expect(() => convertUsdToVes(10, 0)).toThrow();
    expect(() => convertUsdToVes(10, -5)).toThrow();
  });
});

describe("formatUsd / formatDualPrice", () => {
  it("formatea en USD", () => {
    expect(formatUsd(19.9)).toBe("$19.90");
  });

  it("cae a solo USD si no hay tasa (nunca inventa un valor en Bs)", () => {
    expect(formatDualPrice(19.9, null)).toBe("$19.90");
  });

  it("muestra ambas monedas cuando hay tasa", () => {
    const result = formatDualPrice(10, 40);
    expect(result).toContain("$10.00");
    expect(result).toContain("Bs.");
  });
});

describe("calculateSubtotalUsd", () => {
  it("multiplica precio × cantidad por línea y suma, siempre desde el precio recibido (nunca del cliente)", () => {
    const subtotal = calculateSubtotalUsd([
      { unitPriceUsd: 19.99, quantity: 2 },
      { unitPriceUsd: 5.5, quantity: 3 },
    ]);
    expect(subtotal).toBe(roundCurrency(19.99 * 2 + 5.5 * 3));
  });

  it("un carrito vacío da 0", () => {
    expect(calculateSubtotalUsd([])).toBe(0);
  });
});

describe("calculateTotalUsd", () => {
  it("aplica descuento y envío", () => {
    expect(
      calculateTotalUsd({ subtotalUsd: 100, discountUsd: 10, shippingEstimateUsd: 5 }),
    ).toBe(95);
  });

  it("nunca deja el total en negativo aunque el descuento exceda el subtotal", () => {
    expect(calculateTotalUsd({ subtotalUsd: 10, discountUsd: 999 })).toBe(0);
  });

  it("sin descuento ni envío, el total es el subtotal", () => {
    expect(calculateTotalUsd({ subtotalUsd: 42.5 })).toBe(42.5);
  });
});
