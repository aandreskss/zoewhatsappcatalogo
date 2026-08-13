import { CartProvider } from "@/components/cart/cart-context";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Layout del grupo de rutas públicas (sección 5/31 del plan).
 *
 * El Header completo (buscador, categorías, WhatsApp flotante) y el
 * Footer llegan en la Fase 7 sobre el design system. Por ahora se monta
 * el `CartProvider` (todo el sitio público necesita saber el conteo del
 * carrito) y un header mínimo funcional.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      {children}
    </CartProvider>
  );
}
