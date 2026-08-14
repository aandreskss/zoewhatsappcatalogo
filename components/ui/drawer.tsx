"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Drawer/BottomSheet (sección 28/29 del plan): panel deslizante desde
 * abajo en mobile y desde el lado en desktop — el mismo componente cubre
 * los dos casos del inventario ("Modal/Dialog/BottomSheet") vía Tailwind
 * responsive en vez de dos componentes separados. No usa `<dialog>` (a
 * diferencia de `Dialog`) porque necesita la animación de entrada/salida
 * deslizante, que `showModal()` no anima de forma consistente entre
 * navegadores.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "auto",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** "auto" = bottom sheet en mobile, drawer lateral desde `sm:` en adelante. */
  side?: "auto" | "bottom" | "right";
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        style={{ boxShadow: "var(--shadow-lg)" }}
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)]",
          side === "bottom" && "animate-drawer-in-bottom mt-auto",
          side === "right" &&
            "animate-drawer-in-side ml-auto h-full max-h-full w-[min(92vw,24rem)] rounded-t-none",
          side === "auto" &&
            "animate-drawer-in-bottom sm:animate-drawer-in-side mt-auto sm:mt-0 sm:ml-auto sm:h-full sm:max-h-full sm:w-[min(92vw,24rem)] sm:rounded-t-none",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
