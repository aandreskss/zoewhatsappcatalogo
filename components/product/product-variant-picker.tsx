"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ProductDetail } from "@/lib/domain/catalog-types";
import { describeAvailability } from "@/lib/domain/inventory-shared";
import { formatDualPrice } from "@/lib/domain/pricing";
import { useCart } from "@/components/cart/cart-context";
import { useAnalytics } from "@/components/analytics/analytics-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Selector de color/talla + agregar al carrito (sección 13/18/20 del
 * plan). Genérico sobre `product.options` — no asume que las opciones se
 * llaman exactamente "Color"/"Talla", aunque en la práctica Zoe las nombra
 * así.
 */
export function ProductVariantPicker({
  product,
  availableByVariant,
  vesRate,
}: {
  product: ProductDetail;
  availableByVariant: Record<string, number>;
  vesRate: number | null;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const track = useAnalytics();
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const selectedValueIds = Object.values(selected);

  const matchedVariant = product.variants.find(
    (variant) =>
      variant.optionValueIds.length === selectedValueIds.length &&
      selectedValueIds.every((id) => variant.optionValueIds.includes(id)),
  );

  const allOptionsSelected = product.options.every((option) => selected[option.id]);
  const available = matchedVariant ? (availableByVariant[matchedVariant.id] ?? 0) : 0;
  const availability = describeAvailability(available, "urgency_below_3");

  const displayPrice = matchedVariant ?? product.variants[0];

  async function handleAddToCart() {
    if (!matchedVariant) return;
    setIsAdding(true);
    setFeedback(null);
    const result = await addItem(matchedVariant.id, 1);
    setIsAdding(false);
    setFeedback(
      result.ok ? "Agregado al carrito." : (result.error ?? "No se pudo agregar."),
    );
    if (result.ok) {
      track("add_to_cart", {
        entityType: "product_variant",
        entityId: matchedVariant.id,
        metadata: { productId: product.id, productName: product.name },
      });
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {displayPrice ? (
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold">
            {formatDualPrice(displayPrice.priceUsd, vesRate)}
          </span>
          {displayPrice.compareAtPriceUsd &&
          displayPrice.compareAtPriceUsd > displayPrice.priceUsd ? (
            <span className="text-sm text-[var(--color-muted-foreground)] line-through">
              {formatDualPrice(displayPrice.compareAtPriceUsd, vesRate)}
            </span>
          ) : null}
        </div>
      ) : null}

      {product.options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{option.name}</span>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selected[option.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [option.id]: prev[option.id] === value.id ? "" : value.id,
                    }))
                  }
                  className={cn(
                    "min-w-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-muted)]",
                  )}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allOptionsSelected ? (
        <p
          className={cn(
            "text-sm",
            availability.canPurchase
              ? "text-[var(--color-muted-foreground)]"
              : "text-[var(--color-error)]",
          )}
        >
          {matchedVariant ? availability.label : "Esta combinación no está disponible"}
        </p>
      ) : null}

      <Button
        size="lg"
        disabled={!matchedVariant || !availability.canPurchase || isAdding}
        onClick={handleAddToCart}
      >
        {isAdding ? "Agregando…" : "Agregar al carrito"}
      </Button>

      {feedback ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
