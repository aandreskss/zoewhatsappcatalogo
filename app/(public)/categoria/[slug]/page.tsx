import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import { trackEvent } from "@/lib/domain/analytics";
import { ProductGrid } from "@/components/catalog/product-grid";
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";

export const revalidate = 60;

async function getCategory(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, seo_title, seo_description")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.seo_title ?? category.name,
    description: category.seo_description ?? category.description ?? undefined,
    alternates: { canonical: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const supabase = await createSupabaseServerClient();
  const [products, vesRate, sessionId] = await Promise.all([
    listPublishedProducts(supabase, { categorySlug: slug, limit: 48 }),
    getVesReferenceRate(supabase),
    getCartSessionId(),
  ]);

  // Igual que en /buscar: solo se registra si ya hay cookie de sesión (un
  // Server Component no puede crearla).
  if (sessionId) {
    void trackEvent({
      eventType: "view_category",
      clientEventId: crypto.randomUUID(),
      sessionId,
      entityType: "category",
      entityId: category.id,
      metadata: { categoryName: category.name, resultsCount: products.length },
    });
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    { name: category.name, path: `/categoria/${category.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      <h1 className="mb-2 text-2xl font-semibold">{category.name}</h1>
      {category.description ? (
        <p className="mb-6 max-w-2xl text-[var(--color-muted-foreground)]">
          {category.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
    </main>
  );
}
