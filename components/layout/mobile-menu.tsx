"use client";

import * as React from "react";
import Link from "next/link";

export function MobileMenu({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [open, setOpen] = React.useState(false);

  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Tiendas", href: "/tiendas" },
    ...categories.map((c) => ({ label: c.name, href: `/categoria/${c.slug}` })),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden flex flex-col gap-[5px] w-9 h-9 items-center justify-center"
      >
        <span className="block w-5 h-px bg-[var(--color-foreground)]" />
        <span className="block w-5 h-px bg-[var(--color-foreground)]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-[var(--color-foreground)]/20"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-72 bg-[var(--color-background)] h-full shadow-xl flex flex-col p-8" style={{ animation: "none", transform: "none" }}>
            <button
              onClick={() => setOpen(false)}
              className="self-end mb-8 w-8 h-8 flex items-center justify-center"
              aria-label="Cerrar menú"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <p className="font-display text-3xl text-[var(--color-foreground)] mb-8">Zoe</p>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-base font-medium text-[var(--color-foreground)] border-b border-[var(--color-border)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto">
              <p className="text-xs text-[var(--color-muted-foreground)]">Valencia, Venezuela</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">@zoe.valencia</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
