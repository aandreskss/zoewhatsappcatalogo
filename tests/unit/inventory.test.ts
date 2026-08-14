import { describe, it, expect } from "vitest";
import { describeAvailability } from "@/lib/domain/inventory-shared";

describe("describeAvailability", () => {
  it("agotado siempre bloquea la compra sin importar el modo de visibilidad", () => {
    for (const mode of ["exact", "generic", "urgency_below_3", "hidden"] as const) {
      expect(describeAvailability(0, mode)).toEqual({
        canPurchase: false,
        label: "Agotado",
      });
      expect(describeAvailability(-3, mode)).toEqual({
        canPurchase: false,
        label: "Agotado",
      });
    }
  });

  it("modo exact muestra la cantidad real", () => {
    expect(describeAvailability(7, "exact")).toEqual({
      canPurchase: true,
      label: "7 disponibles",
    });
  });

  it("modo urgency_below_3 solo muestra la cantidad cuando es baja", () => {
    expect(describeAvailability(2, "urgency_below_3")).toEqual({
      canPurchase: true,
      label: "Últimas 2 unidades",
    });
    expect(describeAvailability(10, "urgency_below_3")).toEqual({
      canPurchase: true,
      label: "Disponible",
    });
  });

  it("modo hidden nunca revela cantidad, ni siquiera con poco stock", () => {
    expect(describeAvailability(1, "hidden")).toEqual({
      canPurchase: true,
      label: "Disponible",
    });
  });

  it("modo generic nunca revela cantidad", () => {
    expect(describeAvailability(50, "generic")).toEqual({
      canPurchase: true,
      label: "Disponible",
    });
  });
});
