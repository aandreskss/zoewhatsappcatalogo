"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { ProductDetail } from "@/lib/domain/catalog-types";
import { ProductVariantPicker } from "./product-variant-picker";

interface DisplayImage {
  url: string;
  altText: string;
}

interface Props {
  product: ProductDetail;
  availableByVariant: Record<string, number>;
  vesRate: number | null;
  discountPct: number | null;
}

export function ProductPageClient({
  product,
  availableByVariant,
  vesRate,
  discountPct,
}: Props) {
  // Product-level images (already sorted server-side: primary first, then by order)
  const productImages: DisplayImage[] = product.images.map((img) => ({
    url: img.url,
    altText: img.altText || product.name,
  }));

  // Variant images indexed by variantId (build once, stable reference via closure)
  const variantImageMap = new Map<string, DisplayImage[]>(
    product.variants
      .filter((v) => v.images && v.images.length > 0)
      .map((v) => [
        v.id,
        v.images.map((img) => ({ url: img.url, altText: img.altText || product.name })),
      ]),
  );

  const [displayImages, setDisplayImages] = useState<DisplayImage[]>(productImages);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleVariantMatch = useCallback(
    (variantId: string | null) => {
      if (variantId) {
        const vImgs = variantImageMap.get(variantId);
        setDisplayImages(vImgs && vImgs.length > 0 ? vImgs : productImages);
      } else {
        setDisplayImages(productImages);
      }
      setSelectedIndex(0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const primaryImage = displayImages[selectedIndex] ?? displayImages[0] ?? null;
  const thumbnails = displayImages;

  return (
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
              alt={primaryImage.altText}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
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

          {/* Discount badge */}
          {discountPct ? (
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                -{discountPct}%
              </span>
            </div>
          ) : null}
        </div>

        {/* Thumbnail strip */}
        {thumbnails.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {thumbnails.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`relative shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] transition-opacity ${
                  i === selectedIndex
                    ? "ring-2 ring-[var(--color-primary)] opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{ width: "80px", aspectRatio: "3/4" }}
              >
                <Image src={img.url} alt={img.altText} fill className="object-cover" />
              </button>
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
          availableByVariant={availableByVariant}
          vesRate={vesRate}
          onVariantMatch={handleVariantMatch}
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
          <p className="text-xs text-[var(--color-muted-foreground)]">Ref. {product.sku}</p>
        )}
      </div>
    </div>
  );
}
