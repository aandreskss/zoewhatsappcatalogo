"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Modal (sección 28/29 del plan: "Modal, BottomSheet, ConfirmDialog").
 * Se apoya en `<dialog>` nativo en vez de reimplementar focus trap/`Escape`/
 * backdrop a mano — el navegador ya los da correctos y accesibles.
 * `showModal()`/`close()` se sincronizan con la prop `open` en un efecto
 * porque `<dialog>` es un elemento imperativo, no declarativo.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        // Cerrar al hacer click en el backdrop (fuera del `<article>` interno).
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[85vh] w-[min(92vw,32rem)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-0 text-[var(--color-foreground)] backdrop:bg-black/50",
        className,
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
      <div className="p-4">{children}</div>
    </dialog>
  );
}
