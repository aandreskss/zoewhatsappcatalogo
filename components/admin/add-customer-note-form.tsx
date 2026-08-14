"use client";

import { useActionState } from "react";
import { addCustomerNote, type FormState } from "@/app/admin/(protected)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function AddCustomerNoteForm({ customerId }: { customerId: string }) {
  const [state, formAction, isPending] = useActionState(
    addCustomerNote.bind(null, customerId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="customer-note">Agregar nota</Label>
      <textarea
        id="customer-note"
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
