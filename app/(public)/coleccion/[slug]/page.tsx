import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts, type ProductListItem } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { ProductGrid } from "@/components/catalog/product-grid";
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";

export const revalidate = 60;

async function getCollection(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, description, type, rule, seo_title, seo_description")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data;
}

/**
 * Colección manual (lista explícita vía `collection_products`) o "por
 * reglas" (`rule` jsonb, ej. `{"category_id": "...", "max_price_usd": 50}`
 * — sección 12 del plan). El filtro por precio se aplica en memoria
 * porque el precio real vive en `product_variants`, no en `products`.
 */
async function getCollectionProducts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  collection: NonNullable<Awaited<ReturnType<typeof getCollection>>>,
): Promise<ProductListItem[]> {
  if (collection.type === "manual") {
    const { data: links } = await supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collection.id)
      .order("order");
    return listPublishedProducts(supabase, {
      productIds: (links ?? []).map((l) => l.product_id),
      limit: 60,
    });
  }

  const rule = (collection.rule ?? {}) as {
    category_id?: string;
    max_price_usd?: number;
  };
  let categorySlug: string | undefined;
  if (rule.category_id) {
    const { data: category } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", rule.category_id)
      .maybeSingle();
    categorySlug = category?.slug;
  }
  const products = await listPublishedProducts(supabase, { categorySlug, limit: 60 });
  return typeof rule.max_price_usd === "number"
    ? products.filter(
        (p) => p.minPriceUsd !== null && p.minPriceUsd <= rule.max_price_usd!,
      )
    : products;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.seo_title ?? collection.name,
    description: collection.seo_description ?? collection.description ?? undefined,
    alternates: { canonical: `/coleccion/${collection.slug}` },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const supabase = await createSupabaseServerClient();
  const [products, vesRate] = await Promise.all([
    getCollectionProducts(supabase, collection),
    getVesReferenceRate(supabase),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    { name: collection.name, path: `/coleccion/${collection.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      <h1 className="mb-2 text-2xl font-semibold">{collection.name}</h1>
      {collection.description ? (
        <p className="mb-6 max-w-2xl text-[var(--color-muted-foreground)]">
          {collection.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
    </main>
  );
}
