"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

/**
 * Header público mínimo (Fase 2/4). El header completo con buscador,
 * menú de categorías y botón de WhatsApp (sección 6 del plan) se
 * construye en la Fase 7 sobre el design system — esto solo da
 * navegación funcional para probar catálogo → producto → carrito.
 */
export function SiteHeader() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold">
          Zoe
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/catalogo" className="hover:underline">
            Catálogo
          </Link>
          <Link href="/carrito" className="relative flex items-center gap-1">
            <ShoppingBag className="size-5" aria-hidden />
            <span className="sr-only">Carrito</span>
            {itemCount > 0 ? (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
