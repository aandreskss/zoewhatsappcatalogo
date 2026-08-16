"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodActive,
  type FormState,
} from "@/app/admin/(protected)/finanzas/metodos-pago/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Check, X, CreditCard } from "lucide-react";

const initialState: FormState = { error: null };

// ─── Formulario para CREAR ──────────────────────────────
export function PaymentMethodForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createPaymentMethod,
    initialState,
  );

  // Cierra el panel cuando se guarda sin error
  if (state.error === null && !isPending && open) {
    // nada — lo controla el usuario. El revalidate vuelve a renderizar la lista.
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus size={16} />
          Agregar método de pago
        </button>
      ) : (
        <form
          action={async (fd) => {
            await formAction(fd);
            setOpen(false);
          }}
          className="flex flex-col gap-4 rounded-2xl border border-[var(--color-primary)]/30 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--color-foreground)]">Nuevo método de pago</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="pm-name">Nombre</Label>
              <Input
                id="pm-name"
                name="name"
                placeholder="Pago móvil"
                required
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="pm-instructions">Instrucciones para el cliente</Label>
              <Input
                id="pm-instructions"
                name="instructions"
                placeholder="Banco Venezuela · 0412-1234567 · CI 12345678"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Guardando…" : "Crear método"}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancelar
            </button>
          </div>

          {state.error ? (
            <p className="text-sm text-[var(--color-error)]">{state.error}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}

// ─── Card editable de un método existente ─────────────────
interface Method {
  id: string;
  name: string;
  instructions: string | null;
  active: boolean;
}

export function PaymentMethodCard({ method }: { method: Method }) {
  const [editing, setEditing] = useState(false);
  const [localActive, setLocalActive] = useState(method.active);
  const [isPendingToggle, startToggle] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();

  const [editState, editAction, isPendingEdit] = useActionState(
    updatePaymentMethod.bind(null, method.id),
    initialState,
  );

  function handleToggle() {
    const next = !localActive;
    setLocalActive(next); // optimistic update
    startToggle(() => togglePaymentMethodActive(method.id, next));
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${method.name}"? No se puede deshacer.`)) return;
    startDelete(() => deletePaymentMethod(method.id));
  }

  if (editing) {
    return (
      <li className="rounded-2xl border border-[var(--color-primary)]/30 bg-white p-4 shadow-sm">
        <form
          action={async (fd) => {
            await editAction(fd);
            setEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`edit-name-${method.id}`}>Nombre</Label>
              <Input
                id={`edit-name-${method.id}`}
                name="name"
                defaultValue={method.name}
                required
                disabled={isPendingEdit}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`edit-inst-${method.id}`}>Instrucciones</Label>
              <Input
                id={`edit-inst-${method.id}`}
                name="instructions"
                defaultValue={method.instructions ?? ""}
                disabled={isPendingEdit}
                placeholder="Banco, cuenta, teléfono…"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPendingEdit}>
              <Check size={14} />
              {isPendingEdit ? "Guardando…" : "Guardar"}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancelar
            </button>
            {editState.error && (
              <p className="text-sm text-[var(--color-error)]">{editState.error}</p>
            )}
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`flex items-start gap-4 rounded-2xl border bg-white p-4 transition-opacity ${!localActive ? "opacity-60" : ""} border-[var(--color-border)]`}>
      {/* Ícono */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
        <CreditCard size={18} className="text-[var(--color-primary)]" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-foreground)]">{method.name}</p>
        {method.instructions ? (
          <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)] truncate">
            {method.instructions}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] italic">
            Sin instrucciones
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Toggle activo */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPendingToggle}
          title={method.active ? "Desactivar" : "Activar"}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
            localActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              localActive ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>

        {/* Editar */}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          title="Editar"
        >
          <Pencil size={15} />
        </button>

        {/* Eliminar */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPendingDelete}
          className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] disabled:opacity-50"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}
