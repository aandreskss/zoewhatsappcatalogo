import type { ProductListItem } from "@/lib/domain/catalog-types";
import { ProductCard } from "@/components/catalog/product-card";

export function RelatedProducts({
  products,
  vesRate,
}: {
  products: ProductListItem[];
  vesRate: number | null;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-6 md:px-12 py-14 md:py-20">
      {/* Encabezado */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-1">
            Descubre más
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-[var(--color-foreground)]">
            También te puede gustar
          </h2>
        </div>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} vesRate={vesRate} />
        ))}
      </div>
    </section>
  );
}
