import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import { trackEvent } from "@/lib/domain/analytics";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CatalogFiltersBar } from "@/components/catalog/catalog-filters-bar";

export const revalidate = 60;

type CatalogSearchParams = {
  categoria?: string;
  marca?: string;
  q?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const { categoria, marca, q, precio_min, precio_max } = await searchParams;
  const activeFilterCount = [categoria, marca, q, precio_min, precio_max].filter(Boolean).length;
  const shouldNoindex = Boolean(q) || activeFilterCount > 1;

  return {
    title: "Catálogo",
    alternates: { canonical: "/catalogo" },
    robots: shouldNoindex ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { categoria, marca, q, precio_min, precio_max, orden } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const sort = orden === "precio_asc" || orden === "precio_desc" ? orden : "recientes";

  const [products, vesRate, sessionId, categoriesResult] = await Promise.all([
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
    supabase.from("categories").select("name, slug").eq("active", true).order("order").limit(12),
  ]);

  const categories = categoriesResult.data ?? [];

  const activeCategory = categoria
    ? (categories.find((c) => c.slug === categoria)?.name ?? null)
    : null;

  const hasActiveFilter = Boolean(precio_min || precio_max || (orden && orden !== "recientes"));
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
    <div className="bg-[var(--color-background)]">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] px-6 py-8 md:px-12">
        <div className="mx-auto max-w-[1440px]">
          {q ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-1">
                Búsqueda
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--color-foreground)]">
                &ldquo;{q}&rdquo;
              </h1>
            </>
          ) : activeCategory ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-1">
                Categoría
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--color-foreground)]">
                {activeCategory}
              </h1>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-1">
                Colección SS 2025
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--color-foreground)]">
                Catálogo completo
              </h1>
            </>
          )}
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {products.length} {products.length === 1 ? "modelo" : "modelos"}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-6 py-6 md:px-12">
        {/* Filters */}
        <div className="mb-6">
          <CatalogFiltersBar
            current={{ categoria, marca, q, precio_min, precio_max, orden: sort }}
            categories={categories}
          />
        </div>

        {/* Grid */}
        <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
      </main>
    </div>
  );
}
