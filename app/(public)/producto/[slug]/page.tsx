import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getPublishedProductBySlug } from "@/lib/domain/catalog";
import { getAvailabilityForVariants } from "@/lib/domain/inventory";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { ProductPageClient } from "@/components/product/product-page-client";
import { ViewProductTracker } from "@/components/analytics/view-product-tracker";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  jsonLdScriptProps,
} from "@/lib/seo/json-ld";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const product = await getPublishedProductBySlug(supabase, slug);
  if (!product) return {};

  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.descriptionShort ?? undefined;
  const primaryImage = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/producto/${product.slug}`,
      type: "website",
      images: primaryImage ? [{ url: primaryImage }] : undefined,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const product = await getPublishedProductBySlug(supabase, slug);
  if (!product) notFound();

  const [availability, vesRate] = await Promise.all([
    getAvailabilityForVariants(
      supabase,
      product.variants.map((v) => v.id),
    ),
    getVesReferenceRate(supabase),
  ]);

  const availableByVariant = new Map<string, number>();
  for (const row of availability) {
    availableByVariant.set(
      row.variantId,
      (availableByVariant.get(row.variantId) ?? 0) + Math.max(row.available, 0),
    );
  }

  const prices = product.variants.map((v) => v.priceUsd);
  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: product.descriptionShort ?? product.description,
    slug: product.slug,
    sku: product.sku,
    imageUrls: product.images.map((img) => img.url),
    minPriceUsd: prices.length > 0 ? Math.min(...prices) : 0,
    maxPriceUsd: prices.length > 0 ? Math.max(...prices) : 0,
    hasStock: [...availableByVariant.values()].some((qty) => qty > 0),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    { name: product.name, path: `/producto/${product.slug}` },
  ]);

  const activeVariants = product.variants.filter((v) => v.status === "active");
  const variantPrices = activeVariants.map((v) => v.priceUsd);
  const variantComparePrices = activeVariants
    .map((v) => v.compareAtPriceUsd)
    .filter((p): p is number => p !== null);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxComparePrice =
    variantComparePrices.length > 0 ? Math.max(...variantComparePrices) : null;
  const discountPct =
    minVariantPrice && maxComparePrice && maxComparePrice > minVariantPrice
      ? Math.round((1 - minVariantPrice / maxComparePrice) * 100)
      : null;

  return (
    <div className="bg-[var(--color-background)]">
      <script {...jsonLdScriptProps(productJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      <ViewProductTracker productId={product.id} productName={product.name} />

      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 py-4 text-xs text-[var(--color-muted-foreground)]">
          <Link
            href="/"
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            Inicio
          </Link>
          <span>/</span>
          <Link
            href="/catalogo"
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-[var(--color-foreground)] truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <ProductPageClient
          product={product}
          availableByVariant={Object.fromEntries(availableByVariant)}
          vesRate={vesRate?.rate ?? null}
          discountPct={discountPct}
        />
      </div>
    </div>
  );
}
