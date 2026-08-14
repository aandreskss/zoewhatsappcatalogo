"use client";

import { useActionState, useState } from "react";
import { createStore, type FormState } from "@/app/admin/(protected)/entrega/sucursales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { StoreFields } from "@/components/admin/store-fields";

const initialState: FormState = { error: null };

export function CreateStoreForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createStore, initialState);

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus size={16} />
          Agregar sucursal
        </button>
      ) : (
        <form
          action={async (fd) => {
            await formAction(fd);
            if (!state.error) setOpen(false);
          }}
          className="flex flex-col gap-5 rounded-2xl border border-[var(--color-primary)]/30 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--color-foreground)]">Nueva sucursal</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X size={16} />
            </button>
          </div>

          <StoreFields disabled={isPending} />

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Guardando…" : "Crear sucursal"}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancelar
            </button>
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-error)]">{state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
