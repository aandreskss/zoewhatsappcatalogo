import { cn } from "@/lib/utils";

/**
 * Skeleton genérico (sección 28/29 del plan: "Skeletons — card, galería,
 * texto"). Un solo bloque parametrizable en vez de tres componentes
 * separados — `className` controla forma/tamaño (`aspect-square` para
 * galería, `h-4 w-full` para texto, etc.). Respeta
 * `prefers-reduced-motion` vía la regla global en `globals.css` (el
 * `animate-pulse` de Tailwind usa `animation`, que esa regla ya frena).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Cargando…"
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]",
        className,
      )}
    />
  );
}

/** Skeleton de `ProductCard` — mismo layout que la tarjeta real para que no "salte" el contenido al llegar. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-2">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

/** Grilla de `ProductCardSkeleton` — mismas columnas que `ProductGrid` para reusarse mientras carga una lista de productos. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
