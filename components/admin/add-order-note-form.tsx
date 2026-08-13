"use client";

import { useActionState } from "react";
import { addOrderNote, type FormState } from "@/app/admin/(protected)/pedidos/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

/** Nota interna del pedido — nunca visible para el cliente (sección 18/58 del plan). */
export function AddOrderNoteForm({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(
    addOrderNote.bind(null, orderId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="note">Agregar nota interna</Label>
      <textarea
        id="note"
        name="note"
        required
        disabled={isPending}
        rows={3}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Guardar nota"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
