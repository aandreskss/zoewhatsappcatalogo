import { describe, expect, it } from "vitest";
import { redactSensitive } from "@/lib/observability/logger";

describe("redactSensitive", () => {
  it("redacta campos cuyo nombre luce sensible, sin importar el anidamiento", () => {
    const input = {
      orderNumber: "ZOE-0001",
      customer: {
        name: "Ana Pérez",
        phone: "+58 412 1234567",
        password: "no-debería-existir-aquí-pero-por-si-acaso",
      },
      mfa: { code: "123456" },
    };

    const result = redactSensitive(input) as Record<string, unknown>;

    expect(result.orderNumber).toBe("ZOE-0001");
    const customer = result.customer as Record<string, unknown>;
    expect(customer.name).toBe("Ana Pérez");
    expect(customer.phone).toBe("[redactado]");
    expect(customer.password).toBe("[redactado]");
    const mfa = result.mfa as Record<string, unknown>;
    expect(mfa.code).toBe("[redactado]");
  });

  it("redacta dentro de arreglos", () => {
    const input = [{ token: "abc123" }, { name: "ok" }];
    const result = redactSensitive(input) as Record<string, unknown>[];
    expect(result[0]!.token).toBe("[redactado]");
    expect(result[1]!.name).toBe("ok");
  });

  it("deja pasar valores primitivos y no lanza con anidamiento profundo", () => {
    expect(redactSensitive("texto plano")).toBe("texto plano");
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(null)).toBe(null);

    let deep: unknown = { value: "fondo" };
    for (let i = 0; i < 10; i++) {
      deep = { child: deep };
    }
    expect(() => redactSensitive(deep)).not.toThrow();
  });
});
