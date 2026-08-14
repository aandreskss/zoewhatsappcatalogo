import Link from "next/link";
import type { ProductListItem } from "@/lib/domain/catalog-types";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";

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
      <EmptyState
        title="No encontramos productos con estos filtros"
        description="Prueba quitando alguno de los filtros aplicados."
        action={
          // Enlace a /tiendas (no a un wa.me sin número, que no llevaba a
          // ningún lado) — desde ahí el cliente encuentra el WhatsApp real
          // de cada sucursal.
          <Link href="/tiendas" className="text-sm underline">
            Ver nuestras tiendas y escribirnos
          </Link>
        }
      />
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
