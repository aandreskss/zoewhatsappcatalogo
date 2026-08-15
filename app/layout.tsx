import type { Metadata } from "next";
import "./globals.css";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getActiveTheme } from "@/lib/domain/theme";
import { ThemeStyleOverride } from "@/components/theme-style-override";

export async function generateMetadata(): Promise<Metadata> {
  let googleVerification: string | undefined;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase
      .from("integrations")
      .select("public_config, active")
      .eq("provider", "google_search_console")
      .single();
    if (data?.active) {
      const cfg = data.public_config as Record<string, unknown>;
      if (typeof cfg?.verificationCode === "string" && cfg.verificationCode) {
        googleVerification = cfg.verificationCode;
      }
    }
  } catch {
    // Sin Supabase (build/preview) → sin tag de verificación
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: "Zoe Shop",
      template: "%s · Zoe Shop",
    },
    description:
      "Catálogo de calzado Zoe Shop — damas, caballeros, deportivo y escolar. Arma tu pedido y coordínalo por WhatsApp. Valencia, Venezuela.",
    ...(googleVerification && {
      verification: { google: googleVerification },
    }),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cliente de service role (no de sesión) a propósito: llamar a
  // `cookies()` aquí forzaría TODO el sitio a renderizado dinámico por
  // request (rompiendo el ISR de `/catalogo`/`/producto/[slug]`/Home) solo
  // para leer un theme que de todas formas es público. Mismo patrón que
  // `app/sitemap.ts`.
  let theme = null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    theme = await getActiveTheme(supabase);
  } catch {
    // Sin vars de entorno (build/preview sin Supabase) → theme por defecto de globals.css
  }

  return (
    <html lang="es-VE">
      <body>
        <ThemeStyleOverride theme={theme} />
        {children}
      </body>
    </html>
  );
}
