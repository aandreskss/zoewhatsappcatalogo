import type { ProductListItem } from "@/lib/domain/catalog-types";
import { ProductCard } from "@/components/catalog/product-card";

/** Grilla de productos + estado vacío, compartida por /catalogo, /categoria/[slug], /marca/[slug] y /coleccion/[slug]. */
export function ProductGrid({
  products,
  vesRate,
}: {
  products: ProductListItem[];
  vesRate: number | null;
}) {
  if (products.length === 0) {
    return (
      <p className="text-[var(--color-muted-foreground)]">
        No encontramos productos con estos filtros. Prueba quitando alguno o{" "}
        <a href="https://wa.me/" className="underline">
          escríbenos por WhatsApp
        </a>{" "}
        y te ayudamos a encontrar lo que buscas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} vesRate={vesRate} />
      ))}
    </div>
  );
}
