import {
  RADIUS_PRESETS,
  contrastForeground,
  type SafeThemeTokens,
} from "@/lib/domain/theme-shared";

/**
 * Inyecta el theme activo como overrides de `:root` (sección 28 del plan).
 * Cada valor ya pasó por `parseThemeTokens` (regex de color hex + enum de
 * radio) antes de llegar aquí — nunca texto libre de admin interpolado sin
 * validar en un `<style>`. Vive en `app/layout.tsx` (layout raíz, no solo
 * el público) para que también afecte a las páginas de error/login.
 */
export function ThemeStyleOverride({ theme }: { theme: SafeThemeTokens | null }) {
  if (!theme) return null;
  const radius = RADIUS_PRESETS[theme.radius];

  const css = `:root {
  --color-primary: ${theme.colorPrimary};
  --color-primary-foreground: ${contrastForeground(theme.colorPrimary)};
  --color-secondary: ${theme.colorSecondary};
  --color-secondary-foreground: ${contrastForeground(theme.colorSecondary)};
  --color-accent: ${theme.colorAccent};
  --radius-sm: ${radius.sm};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
}`;

  return <style>{css}</style>;
}
