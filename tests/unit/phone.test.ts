import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/domain/phone";

describe("normalizePhone", () => {
  it("respeta un número internacional con +", () => {
    expect(normalizePhone("+1 415-555-0100")).toBe("+14155550100");
  });

  it("convierte un local venezolano con 0 inicial (11 dígitos) a +58", () => {
    expect(normalizePhone("0412-123-4567")).toBe("+584121234567");
  });

  it("convierte un local venezolano sin 0 inicial (10 dígitos) a +58", () => {
    expect(normalizePhone("4121234567")).toBe("+584121234567");
  });

  it("es consistente entre las dos formas de escribir el mismo número venezolano", () => {
    expect(normalizePhone("0412-123-4567")).toBe(normalizePhone("412-123-4567"));
  });

  it("no inventa un prefijo para longitudes ambiguas — las deja tal cual con +", () => {
    expect(normalizePhone("12345")).toBe("+12345");
  });
});
