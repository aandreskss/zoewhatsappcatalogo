import { notFound } from "next/navigation";
import Image from "next/image";
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

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
      <script {...jsonLdScriptProps(productJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      <ViewProductTracker productId={product.id} productName={product.name} />
      <div className="flex flex-col gap-2">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        {product.images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.slice(1).map((image) => (
              <div
                key={image.url}
                className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]"
              >
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {product.descriptionShort ? (
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              {product.descriptionShort}
            </p>
          ) : null}
        </div>

        <ProductVariantPicker
          product={product}
          availableByVariant={Object.fromEntries(availableByVariant)}
          vesRate={vesRate?.rate ?? null}
        />

        {product.description ? (
          <div className="border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted-foreground)]">
            {product.description}
          </div>
        ) : null}
      </div>
    </main>
  );
}
