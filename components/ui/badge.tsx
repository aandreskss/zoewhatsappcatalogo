import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge genérico (sección 28/29 del plan) — extraído de `product-card.tsx`
 * (donde vivía duplicado como componente local) para reusarse también en
 * `StatusBadge` y en cualquier otro punto que necesite una etiqueta corta.
 */
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted" | "success" | "warning" | "error";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        variant === "accent" && "bg-[var(--color-accent)] text-[var(--color-foreground)]",
        variant === "muted" && "bg-[var(--color-muted)] text-[var(--color-foreground)]",
        variant === "success" &&
          "bg-[var(--color-success)]/15 text-[var(--color-success)]",
        variant === "warning" &&
          "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
        variant === "error" && "bg-[var(--color-error)]/15 text-[var(--color-error)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
