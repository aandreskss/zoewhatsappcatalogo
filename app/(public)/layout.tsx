import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getActivePublicIntegrations } from "@/lib/domain/integrations";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/domain/site-content";
import { CartProvider } from "@/components/cart/cart-context";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ThirdPartyScripts } from "@/components/analytics/third-party-scripts";
import { ToastProvider } from "@/components/ui/toast";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import type { SiteContent } from "@/lib/domain/site-content-types";

/**
 * Layout del grupo de rutas públicas (sección 5/28/31 del plan). Header
 * (desktop + menú mobile) y Footer completos desde la Fase 1 del design
 * system. `CartProvider` (conteo del carrito), `AnalyticsProvider` (Fase
 * 9) y `ToastProvider` (Fase 1 — feedback de acciones tipo "agregado al
 * carrito") envuelven todo el árbol público.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let integrations: Awaited<ReturnType<typeof getActivePublicIntegrations>> = [];
  let categories: { name: string; slug: string }[] = [];
  let content: SiteContent = DEFAULT_SITE_CONTENT;
  try {
    const supabase = await createSupabaseServerClient();
    const [integrationsResult, categoriesResult, contentResult] = await Promise.all([
      getActivePublicIntegrations(supabase),
      supabase.from("categories").select("name, slug").eq("active", true).order("order").limit(8),
      getSiteContent(supabase),
    ]);
    integrations = integrationsResult;
    categories = categoriesResult.data ?? [];
    content = contentResult;
  } catch {
    // Sin Supabase configurado (build sin vars), header se renderiza con defaults
  }

  return (
    <CartProvider>
      <AnalyticsProvider>
        <ToastProvider>
          <ThirdPartyScripts integrations={integrations} />
          <SiteHeader categories={categories ?? []} navLinks={content.navLinks} />
          <div className="pt-14 md:pt-16">
            {children}
          </div>
          <SiteFooter content={content} />
        </ToastProvider>
      </AnalyticsProvider>
    </CartProvider>
  );
}
