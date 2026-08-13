"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/pricing";

/**
 * Carrito (sección 22 del plan). El CTA es "Finalizar pedido", nunca
 * "Pagar" — todavía no hay pago dentro de la plataforma, y el total
 * mostrado aquí es solo estimado: el checkout SIEMPRE recalcula en
 * servidor antes de crear el pedido.
 */
export default function CartPage() {
  const { items, isLoading, subtotalUsd, updateQuantity, removeItem } = useCart();

  if (isLoading) {
    return <main className="mx-auto max-w-2xl px-4 py-8">Cargando carrito…</main>;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Explora el catálogo y encuentra tu próximo par.
        </p>
        <Button asChild>
          <Link href="/catalogo">Ver catálogo</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Tu carrito</h1>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-[var(--color-border)] pb-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Link
                href={`/producto/${item.productSlug}`}
                className="text-sm font-medium hover:underline"
              >
                {item.productName}
              </Link>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {item.variantLabel}
              </span>
              {!item.isAvailable ? (
                <span className="text-xs text-[var(--color-error)]">
                  Ya no está disponible
                </span>
              ) : null}
              <div className="mt-1 flex items-center gap-2">
                <label className="sr-only" htmlFor={`qty-${item.id}`}>
                  Cantidad
                </label>
                <input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  max={20}
                  value={item.quantity}
                  onChange={(event) =>
                    void updateQuantity(item.id, Number(event.target.value))
                  }
                  className="h-9 w-16 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  className="text-xs text-[var(--color-muted-foreground)] underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <span className="text-sm font-medium">
              {formatUsd(item.currentPriceUsd * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted-foreground)]">
          Subtotal estimado — el total final se confirma al finalizar el pedido
        </span>
        <span className="text-lg font-semibold">{formatUsd(subtotalUsd)}</span>
      </div>

      <Button asChild size="lg" className="mt-4 w-full">
        <Link href="/checkout">Finalizar pedido</Link>
      </Button>
    </main>
  );
}
