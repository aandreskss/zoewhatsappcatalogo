import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getPublishedProductBySlug } from "@/lib/domain/catalog";
import { getAvailabilityForVariants } from "@/lib/domain/inventory";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
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

  const sortedImages = [...product.images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.order - b.order;
  });
  const primaryImage = sortedImages[0] ?? null;
  const thumbnails = sortedImages.slice(1, 5);

  const activeVariants = product.variants.filter((v) => v.status === "active");
  const variantPrices = activeVariants.map((v) => v.priceUsd);
  const variantComparePrices = activeVariants
    .map((v) => v.compareAtPriceUsd)
    .filter((p): p is number => p !== null);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxComparePrice = variantComparePrices.length > 0 ? Math.max(...variantComparePrices) : null;
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
          <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-[var(--color-foreground)] transition-colors">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-[var(--color-foreground)] truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-8 pb-16 md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Image column */}
          <div className="flex flex-col gap-3">
            {/* Primary image */}
            <div
              className="relative w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)]"
              style={{ aspectRatio: "3/4" }}
            >
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText || product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}

              {/* Badges */}
              {discountPct ? (
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    -{discountPct}%
                  </span>
                </div>
              ) : null}
            </div>

            {/* Thumbnail strip */}
            {thumbnails.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {thumbnails.map((img) => (
                  <div
                    key={img.url}
                    className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)]"
                    style={{ width: "80px", aspectRatio: "3/4" }}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-5">
            {/* Name + short description */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--color-foreground)] leading-tight">
                {product.name}
              </h1>
              {product.descriptionShort && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {product.descriptionShort}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--color-border)]" />

            {/* Variant picker (price + options + add to cart) */}
            <ProductVariantPicker
              product={product}
              availableByVariant={Object.fromEntries(availableByVariant)}
              vesRate={vesRate?.rate ?? null}
            />

            {/* Description accordion-lite */}
            {(product.description || product.material) && (
              <>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex flex-col gap-3">
                  {product.description && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted-foreground)]">
                        Descripción
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                        {product.description}
                      </p>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted-foreground)]">
                        Material
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                        {product.material}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Ref. {product.sku}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
