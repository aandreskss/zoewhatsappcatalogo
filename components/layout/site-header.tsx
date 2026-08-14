"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function SiteHeader({
  categories,
  navLinks,
}: {
  categories: { name: string; slug: string }[];
  navLinks: { label: string; href: string }[];
}) {
  const { itemCount } = useCart();

  const rightLinks = categories.slice(0, 3).map((c) => ({
    label: c.name,
    href: `/categoria/${c.slug}`,
  }));

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "rgba(255,253,252,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ECE7EA",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12">
        <div className="relative flex items-center justify-between h-14 md:h-16">
          {/* Mobile: hamburger left */}
          <MobileMenu categories={categories} navLinks={navLinks} />

          {/* Desktop: nav left */}
          <nav className="hidden md:flex items-center gap-7 flex-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logo — centered absolute */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-display text-2xl md:text-3xl tracking-wide text-[var(--color-foreground)]"
          >
            Zoe
          </Link>

          {/* Desktop: nav right */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-end">
            {rightLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Icons right */}
          <div className="flex items-center gap-1">
            <Link
              href="/buscar"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-rose-light)] transition-colors duration-150"
              aria-label="Buscar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>
            <Link
              href="/carrito"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-rose-light)] transition-colors duration-150"
              aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} productos` : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[9px] font-semibold flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
