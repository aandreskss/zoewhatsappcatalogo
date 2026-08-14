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
  colorPrimary: "#2e2a4d",
  colorSecondary: "#c98a5e",
  colorAccent: "#d9c25a",
  radius: "md",
};

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

export function contrastForeground(hex: string): "#ffffff" | "#0a0a0a" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#0a0a0a" : "#ffffff";
}
