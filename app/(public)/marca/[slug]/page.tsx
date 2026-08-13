import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { listPublishedProducts } from "@/lib/domain/catalog";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { ProductGrid } from "@/components/catalog/product-grid";
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";

export const revalidate = 60;

async function getBrand(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, description")
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
  const brand = await getBrand(slug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: brand.description ?? undefined,
    alternates: { canonical: `/marca/${brand.slug}` },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const supabase = await createSupabaseServerClient();
  const [products, vesRate] = await Promise.all([
    listPublishedProducts(supabase, { brandSlug: slug, limit: 48 }),
    getVesReferenceRate(supabase),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Marcas", path: "/catalogo" },
    { name: brand.name, path: `/marca/${brand.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      <h1 className="mb-2 text-2xl font-semibold">{brand.name}</h1>
      {brand.description ? (
        <p className="mb-6 max-w-2xl text-[var(--color-muted-foreground)]">
          {brand.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <ProductGrid products={products} vesRate={vesRate?.rate ?? null} />
    </main>
  );
}
