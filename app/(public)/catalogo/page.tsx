import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { ProductCard } from "@/components/catalog/product-card";

export const metadata = {
  title: "Catálogo",
};

// El catálogo cambia con cada publicación de producto; se revalida bajo
// demanda desde el admin (Fase 7/8). Mientras tanto, un valor corto evita
// servir datos completamente estáticos sin tener aún el webhook de
// revalidación.
export const revalidate = 60;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; marca?: string; q?: string }>;
}) {
  const { categoria, marca, q } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [products, vesRate] = await Promise.all([
    listPublishedProducts(supabase, {
      categorySlug: categoria,
      brandSlug: marca,
      search: q,
      limit: 48,
    }),
    getVesReferenceRate(supabase),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Catálogo</h1>

      {products.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          No encontramos productos con estos filtros. Prueba quitando alguno o{" "}
          <a href={`https://wa.me/`} className="underline">
            escríbenos por WhatsApp
          </a>{" "}
          y te ayudamos a encontrar lo que buscas.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              vesRate={vesRate?.rate ?? null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
