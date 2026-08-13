import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getActivePublicIntegrations } from "@/lib/domain/integrations";
import { CartProvider } from "@/components/cart/cart-context";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ThirdPartyScripts } from "@/components/analytics/third-party-scripts";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Layout del grupo de rutas públicas (sección 5/31 del plan).
 *
 * El Header completo (buscador, categorías, WhatsApp flotante) y el
 * Footer llegan en la Fase 7 sobre el design system. Por ahora se monta
 * el `CartProvider` (todo el sitio público necesita saber el conteo del
 * carrito), `AnalyticsProvider` (Fase 9 — captura de eventos internos) y
 * un header mínimo funcional.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const integrations = await getActivePublicIntegrations(supabase);

  return (
    <CartProvider>
      <AnalyticsProvider>
        <ThirdPartyScripts integrations={integrations} />
        <SiteHeader />
        {children}
      </AnalyticsProvider>
    </CartProvider>
  );
}
