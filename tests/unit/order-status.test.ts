import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusBadgeVariant,
} from "@/lib/domain/order-status";

describe("orderStatusLabel", () => {
  it("tiene una etiqueta para cada estado declarado", () => {
    for (const status of ORDER_STATUSES) {
      expect(orderStatusLabel(status)).not.toBe(status);
    }
  });

  it("devuelve el valor tal cual si el estado es desconocido (nunca lanza)", () => {
    expect(orderStatusLabel("estado_inventado")).toBe("estado_inventado");
  });
});

describe("orderStatusBadgeVariant", () => {
  it("cancelado es error", () => {
    expect(orderStatusBadgeVariant("cancelado")).toBe("error");
  });

  it("pagado/confirmado/entregado son success", () => {
    expect(orderStatusBadgeVariant("pagado")).toBe("success");
    expect(orderStatusBadgeVariant("confirmado")).toBe("success");
    expect(orderStatusBadgeVariant("entregado")).toBe("success");
  });

  it("nuevo es muted", () => {
    expect(orderStatusBadgeVariant("nuevo")).toBe("muted");
  });

  it("el resto de estados intermedios son warning", () => {
    expect(orderStatusBadgeVariant("preparando")).toBe("warning");
  });
});
