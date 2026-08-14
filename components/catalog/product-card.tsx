import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "@/lib/domain/catalog-types";
import { formatDualPrice } from "@/lib/domain/pricing";

export function ProductCard({
  product,
  vesRate,
}: {
  product: ProductListItem;
  vesRate: number | null;
}) {
  const hasDiscount =
    product.maxCompareAtPriceUsd !== null &&
    product.minPriceUsd !== null &&
    product.maxCompareAtPriceUsd > product.minPriceUsd;

  const discount =
    hasDiscount && product.maxCompareAtPriceUsd && product.minPriceUsd
      ? Math.round((1 - product.minPriceUsd / product.maxCompareAtPriceUsd) * 100)
      : null;

  return (
    <Link href={`/producto/${product.slug}`} className="group flex flex-col cursor-pointer">
      {/* Image 3:4 */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]"
        style={{ aspectRatio: "3/4" }}
      >
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && !hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-sage)] text-[var(--color-foreground)]">
              Nuevo
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
              {discount}% OFF
            </span>
          )}
          {product.badgeCustom && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-lavender)] text-[var(--color-foreground)]">
              {product.badgeCustom}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-1 px-0.5">
        <p className="text-sm md:text-[15px] font-medium text-[var(--color-foreground)] leading-snug line-clamp-2">
          {product.name}
        </p>
        <div className="flex items-center gap-2">
          {product.minPriceUsd !== null ? (
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {formatDualPrice(product.minPriceUsd, vesRate)}
            </span>
          ) : (
            <span className="text-sm text-[var(--color-muted-foreground)]">Consultar</span>
          )}
          {hasDiscount && product.maxCompareAtPriceUsd !== null && (
            <span className="text-xs text-[var(--color-muted-foreground)] line-through">
              {formatDualPrice(product.maxCompareAtPriceUsd, vesRate)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
