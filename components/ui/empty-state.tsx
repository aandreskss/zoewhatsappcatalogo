import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * `EmptyState` genérico (sección 28/29 del plan). Reemplaza los mensajes
 * de "no hay nada" escritos a mano y sin estructura consistente que había
 * en varias páginas (ej. `ProductGrid`, que además tenía un enlace
 * `https://wa.me/` roto sin número — corregido al migrar a este
 * componente, ver `product-grid.tsx`).
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
