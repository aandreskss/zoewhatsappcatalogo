import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "@/lib/domain/catalog-types";
import { formatDualPrice } from "@/lib/domain/pricing";
import { Badge } from "@/components/ui/badge";

/**
 * Tarjeta de producto genérica (sección 9/29 del plan). No contiene texto
 * ni colores de Zoe — todo viene de props/datos.
 */
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

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-2 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew ? <Badge>Nuevo</Badge> : null}
          {hasDiscount ? <Badge variant="accent">Oferta</Badge> : null}
          {product.badgeCustom ? <Badge>{product.badgeCustom}</Badge> : null}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        {product.minPriceUsd !== null ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {formatDualPrice(product.minPriceUsd, vesRate)}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">Consultar</p>
        )}
      </div>
    </Link>
  );
}
