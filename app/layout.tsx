import type { Metadata } from "next";
import "./globals.css";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getActiveTheme } from "@/lib/domain/theme";
import { ThemeStyleOverride } from "@/components/theme-style-override";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Zoe Shoes",
    template: "%s · Zoe Shoes",
  },
  description:
    "Catálogo de zapatos Zoe — encuentra tu talla y arma tu pedido para coordinarlo por WhatsApp.",
};

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
