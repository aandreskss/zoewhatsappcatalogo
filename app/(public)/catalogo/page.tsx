import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import { trackEvent } from "@/lib/domain/analytics";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CatalogFiltersBar } from "@/components/catalog/catalog-filters-bar";

// El catálogo cambia con cada publicación de producto; se revalida bajo
// demanda desde el admin (Fase 7/8). Mientras tanto, un valor corto evita
// servir datos completamente estáticos sin tener aún el webhook de
// revalidación.
export const revalidate = 60;

type CatalogSearchParams = {
  categoria?: string;
  marca?: string;
  q?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
};

/**
 * Indexabilidad de `/catalogo` con filtros (sección 22 del plan): la vista
 * base (sin filtros) y una única combinación categoría-o-marca son
 * indexables. Cualquier combinación de 2+ filtros, o una búsqueda (`q`,
 * cuyo contenido "canónico" ya vive en `/buscar`), se marca `noindex` para
 * no competir por posicionamiento con contenido casi duplicado.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const { categoria, marca, q, precio_min, precio_max } = await searchParams;
  const activeFilterCount = [categoria, marca, q, precio_min, precio_max].filter(
    Boolean,
  ).length;
  const shouldNoindex = Boolean(q) || activeFilterCount > 1;

  return {
    title: "Catálogo",
    alternates: { canonical: "/catalogo" },
    robots: shouldNoindex ? { index: false, follow: true } : undefined,
  };
}

/**
 * Filtros persistentes (sección 8/46 del plan): categoría, marca, precio
 * y orden viven en la URL (`searchParams`), no en estado de cliente ni
 * cookies — así sobreviven a un refresh, son compartibles/bookmarkeables
 * y funcionan sin JavaScript.
 */
export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { categoria, marca, q, precio_min, precio_max, orden } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const sort = orden === "precio_asc" || orden === "precio_desc" ? orden : "recientes";

  const [products, vesRate, sessionId] = await Promise.all([
    listPublishedProducts(supabase, {
      categorySlug: categoria,
      brandSlug: marca,
      search: q,
      minPriceUsd: precio_min ? Number(precio_min) : undefined,
      maxPriceUsd: precio_max ? Number(precio_max) : undefined,
      sort,
      limit: 48,
    }),
    getVesReferenceRate(supabase),
    getCartSessionId(),
  ]);

  // `filter_applied` solo cuando el visitante realmente aplicó un filtro
  // de precio/orden (no en la vista base del catálogo) — igual que en
  // /buscar y /categoria, solo si ya existe cookie de sesión.
  const hasActiveFilter = Boolean(
    precio_min || precio_max || (orden && orden !== "recientes"),
  );
  if (sessionId && hasActiveFilter) {
    void trackEvent({
      eventType: "filter_applied",
      clientEventId: crypto.randomUUID(),
      sessionId,
      metadata: {
        categoria: categoria ?? null,
        marca: marca ?? null,
        precioMin: precio_min ?? null,
        precioMax: precio_max ?? null,
        orden: sort,
        resultsCount: products.length,
      },
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Catálogo</h1>
      <CatalogFiltersBar
        current={{ categoria, marca, q, precio_min, precio_max, orden: sort }}
      />
      <div className="mt-4">
        <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
      </div>
    </main>
  );
}
