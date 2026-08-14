"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * `ConfirmDialog` (sección 29 del plan) sobre `Dialog` — para acciones
 * destructivas o irreversibles del admin (ej. desactivar algo con efectos
 * en cascada) donde un `window.confirm()` nativo no se ve bien y no se
 * puede estilizar, pero tampoco se justifica un modal a medida cada vez.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDangerous = false,
  isPending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isPending?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {description ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDangerous ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Procesando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
