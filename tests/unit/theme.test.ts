import { describe, it, expect } from "vitest";
import { parseThemeTokens, contrastForeground } from "@/lib/domain/theme-shared";

describe("parseThemeTokens", () => {
  const valid = {
    colorPrimary: "#2e2a4d",
    colorSecondary: "#c98a5e",
    colorAccent: "#d9c25a",
    radius: "md",
  };

  it("acepta tokens válidos", () => {
    expect(parseThemeTokens(valid)).toEqual(valid);
  });

  it("rechaza null/undefined/tipos no-objeto", () => {
    expect(parseThemeTokens(null)).toBeNull();
    expect(parseThemeTokens(undefined)).toBeNull();
    expect(parseThemeTokens("not an object")).toBeNull();
  });

  it("rechaza un color que no sea hex de 6 dígitos — nunca deja pasar CSS arbitrario a un <style>", () => {
    expect(parseThemeTokens({ ...valid, colorPrimary: "red" })).toBeNull();
    expect(parseThemeTokens({ ...valid, colorPrimary: "#fff" })).toBeNull();
    expect(
      parseThemeTokens({ ...valid, colorPrimary: "javascript:alert(1)" }),
    ).toBeNull();
    expect(
      parseThemeTokens({
        ...valid,
        colorPrimary: "#000000; } body { display: none",
      }),
    ).toBeNull();
  });

  it("rechaza un radius fuera del enum de 3 presets", () => {
    expect(parseThemeTokens({ ...valid, radius: "xl" })).toBeNull();
  });
});

describe("contrastForeground", () => {
  it("usa texto oscuro sobre un fondo claro", () => {
    expect(contrastForeground("#ffffff")).toBe("#0a0a0a");
  });

  it("usa texto claro sobre un fondo oscuro", () => {
    expect(contrastForeground("#000000")).toBe("#ffffff");
  });
});
