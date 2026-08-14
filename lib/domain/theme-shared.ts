const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const RADIUS_PRESETS = {
  sm: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", label: "Compacto" },
  md: { sm: "0.5rem", md: "0.875rem", lg: "1.25rem", label: "Balanceado" },
  lg: { sm: "0.75rem", md: "1rem", lg: "1.5rem", label: "Redondeado" },
} as const;

export type RadiusPreset = keyof typeof RADIUS_PRESETS;

export interface SafeThemeTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorForeground: string;
  radius: RadiusPreset;
}

export const DEFAULT_THEME_TOKENS: SafeThemeTokens = {
  colorPrimary: "#C9748A",    // Zoe rose (matches globals.css)
  colorSecondary: "#EEE8F8",  // Zoe lavender
  colorAccent: "#F4D6DD",     // Zoe rose-light
  colorBackground: "#FFFDFC", // Zoe cream
  colorForeground: "#29252A", // Zoe ink
  radius: "md",
};

export function parseThemeTokens(raw: unknown): SafeThemeTokens | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const { colorPrimary, colorSecondary, colorAccent, colorBackground, colorForeground, radius } =
    obj;

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

  // colorBackground and colorForeground are optional (backwards compat)
  const bg =
    typeof colorBackground === "string" && HEX_COLOR_RE.test(colorBackground)
      ? colorBackground
      : DEFAULT_THEME_TOKENS.colorBackground;
  const fg =
    typeof colorForeground === "string" && HEX_COLOR_RE.test(colorForeground)
      ? colorForeground
      : DEFAULT_THEME_TOKENS.colorForeground;

  if (radius !== "sm" && radius !== "md" && radius !== "lg") return null;

  return {
    colorPrimary,
    colorSecondary,
    colorAccent,
    colorBackground: bg,
    colorForeground: fg,
    radius,
  };
}

export function contrastForeground(hex: string): "#ffffff" | "#0a0a0a" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#0a0a0a" : "#ffffff";
}
