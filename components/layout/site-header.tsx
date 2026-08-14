"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { SearchBox } from "@/components/layout/search-box";
import { MobileMenu } from "@/components/layout/mobile-menu";

/**
 * Header público (sección 6/28/29 del plan: desktop + mobile). El menú de
 * categorías completo vive en `MobileMenu` (drawer) en mobile y en un
 * `<nav>` inline en `sm:` en adelante — mismos datos (`categories`),
 * resueltos server-side en `app/(public)/layout.tsx` y pasados como prop
 * porque este componente ya era "use client" por `useCart()`.
 */
export function SiteHeader({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <MobileMenu categories={categories} />
        <Link href="/" className="text-lg font-semibold">
          Zoe
        </Link>
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          <Link href="/catalogo" className="hover:underline">
            Catálogo
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.slug}
              href={`/categoria/${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <div className="flex-1">
          <SearchBox />
        </div>
        <nav className="flex items-center gap-4 text-sm">
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
