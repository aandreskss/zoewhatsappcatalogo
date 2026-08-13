"use client";

import { useActionState } from "react";
import {
  createPaymentMethod,
  type FormState,
} from "@/app/admin/(protected)/finanzas/metodos-pago/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function PaymentMethodForm() {
  const [state, formAction, isPending] = useActionState(
    createPaymentMethod,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="Pago móvil"
          required
          disabled={isPending}
        />
      </div>
      <div className="flex flex-[2] flex-col gap-1">
        <Label htmlFor="instructions">
          Instrucciones (visibles en checkout/WhatsApp)
        </Label>
        <Input
          id="instructions"
          name="instructions"
          placeholder="Banco, cédula, teléfono…"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Crear"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
