"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";

/**
 * Menú mobile (sección 28/29 del plan: "Header (desktop/mobile), menú
 * mobile"). Reusa `Drawer` (lateral en mobile via `side="right"`) en vez
 * de un `<nav>` a medida — primer caso de uso real del primitivo fuera de
 * su propio archivo.
 */
export function MobileMenu({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-muted)] sm:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menú" side="right">
        <nav className="flex flex-col gap-1">
          <Link
            href="/catalogo"
            onClick={() => setOpen(false)}
            className="rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            Todo el catálogo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categoria/${category.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/tiendas"
            onClick={() => setOpen(false)}
            className="rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            Nuestras tiendas
          </Link>
        </nav>
      </Drawer>
    </>
  );
}
