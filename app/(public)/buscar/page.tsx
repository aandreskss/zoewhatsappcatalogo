import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { searchProducts, logSearch } from "@/lib/domain/search";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import { trackEvent } from "@/lib/domain/analytics";
import { ProductGrid } from "@/components/catalog/product-grid";

export const metadata = {
  title: "Buscar",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createSupabaseServerClient();

  const [{ products, resultsCount }, vesRate, sessionId] = await Promise.all([
    query
      ? searchProducts(supabase, query)
      : Promise.resolve({ products: [], resultsCount: 0 }),
    getVesReferenceRate(supabase),
    getCartSessionId(),
  ]);

  if (query) {
    // No se espera (`await`) el log — no debe retrasar la respuesta al
    // cliente, y ya nunca lanza (ver `logSearch`).
    void logSearch(query, resultsCount, sessionId);

    // `search` solo se registra en analytics_events si ya existe cookie de
    // sesión — un Server Component no puede crearla (solo Server
    // Actions/Route Handlers pueden escribir cookies). Un visitante
    // completamente nuevo la obtiene en su primera interacción de cliente
    // (ej. agregar al carrito) vía /api/analytics/events.
    if (sessionId) {
      void trackEvent({
        eventType: "search",
        clientEventId: crypto.randomUUID(),
        sessionId,
        metadata: { query, resultsCount },
      });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">
        Resultados para &ldquo;{query}&rdquo;
      </h1>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        {resultsCount}{" "}
        {resultsCount === 1 ? "producto encontrado" : "productos encontrados"}
      </p>
      <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
    </main>
  );
}
