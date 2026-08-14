import { describe, it, expect } from "vitest";
import { slugify, ensureUniqueSlug } from "@/lib/domain/slug";

describe("slugify", () => {
  it("pasa a minúsculas y reemplaza espacios por guiones", () => {
    expect(slugify("Zapato Deportivo Rojo")).toBe("zapato-deportivo-rojo");
  });

  it("quita acentos", () => {
    expect(slugify("Sandalia Café Niña")).toBe("sandalia-cafe-nina");
  });

  it("colapsa símbolos consecutivos en un solo guión y recorta los bordes", () => {
    expect(slugify("  ¡Oferta!! 50% off  ")).toBe("oferta-50-off");
  });
});

describe("ensureUniqueSlug", () => {
  it("devuelve el slug base si no hay colisión", () => {
    expect(ensureUniqueSlug("zapato-rojo", new Set())).toBe("zapato-rojo");
  });

  it("agrega -2 en la primera colisión", () => {
    expect(ensureUniqueSlug("zapato-rojo", new Set(["zapato-rojo"]))).toBe(
      "zapato-rojo-2",
    );
  });

  it("sigue incrementando hasta encontrar uno libre", () => {
    const existing = new Set(["zapato-rojo", "zapato-rojo-2", "zapato-rojo-3"]);
    expect(ensureUniqueSlug("zapato-rojo", existing)).toBe("zapato-rojo-4");
  });
});
