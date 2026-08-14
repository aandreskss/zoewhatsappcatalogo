import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const RADIUS_PRESETS = {
  sm: { sm: "0.125rem", md: "0.25rem", lg: "0.375rem", label: "Compacto" },
  md: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", label: "Medio (por defecto)" },
  lg: { sm: "0.375rem", md: "0.75rem", lg: "1.25rem", label: "Amplio" },
} as const;

export type RadiusPreset = keyof typeof RADIUS_PRESETS;

export interface SafeThemeTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  radius: RadiusPreset;
}

export const DEFAULT_THEME_TOKENS: SafeThemeTokens = {
  // Mismos valores que los placeholders de `globals.css`, convertidos a
  // hex — si no hay theme activo en BD, el `<style>` de override ni
  // siquiera se renderiza (ver `getActiveTheme`), así que esto es solo
  // el valor que ve el formulario de admin al no haber nada guardado
  // todavía, no un fallback silencioso en el sitio público.
  colorPrimary: "#2e2a4d",
  colorSecondary: "#c98a5e",
  colorAccent: "#d9c25a",
  radius: "md",
};

/**
 * Editor de tokens "dentro de límites seguros" (sección 28 del plan: "no
 * CSS arbitrario"). Solo 3 colores (fondo de marca; el color de texto
 * sobre cada uno se calcula por contraste, ver `contrastForeground`, para
 * no pedirle al admin 6 valores) + un preset de radio de borde — nunca un
 * campo de texto libre que termine interpolado en un `<style>`.
 */
export function parseThemeTokens(raw: unknown): SafeThemeTokens | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const { colorPrimary, colorSecondary, colorAccent, radius } = obj;

  if (
    typeof colorPrimary !== "string" ||
    typeof colorSecondary !== "string" ||
    typeof colorAccent !== "string" ||
    !HEX_COLOR_RE.test(colorPrimary) ||
    !HEX_COLOR_RE.test(colorSecondary) ||
    !HEX_COLOR_RE.test(colorAccent)
  ) {
    return null;
  }
  if (radius !== "sm" && radius !== "md" && radius !== "lg") return null;

  return { colorPrimary, colorSecondary, colorAccent, radius };
}

export function themeTokensToJson(tokens: SafeThemeTokens): Json {
  return { ...tokens } as unknown as Json;
}

/** Blanco o negro según la luminancia relativa del color de fondo (WCAG simplificado) — evita pedirle al admin un color de texto por cada color de marca. */
export function contrastForeground(hex: string): "#ffffff" | "#0a0a0a" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#0a0a0a" : "#ffffff";
}

/**
 * Theme activo para el sitio público — falla en silencio a `null` (nunca
 * lanza) porque esto se llama desde el layout raíz: un theme corrupto o
 * ausente nunca debe tumbar el sitio, solo hace que se sirvan los tokens
 * por defecto de `globals.css`.
 */
export async function getActiveTheme(supabase: DB): Promise<SafeThemeTokens | null> {
  const { data } = await supabase
    .from("themes")
    .select("tokens")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return parseThemeTokens(data.tokens);
}
