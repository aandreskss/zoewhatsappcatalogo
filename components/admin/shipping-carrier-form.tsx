"use client";

import { useActionState } from "react";
import {
  createShippingCarrier,
  type FormState,
} from "@/app/admin/(protected)/entrega/envios/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function ShippingCarrierForm() {
  const [state, formAction, isPending] = useActionState(
    createShippingCarrier,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="name">Empresa de envío</Label>
        <Input
          id="name"
          name="name"
          placeholder="MRW, Zoom, Tealca…"
          required
          disabled={isPending}
        />
      </div>
      <div className="flex flex-[2] flex-col gap-1">
        <Label htmlFor="notes">Notas (condiciones, cobertura)</Label>
        <Input id="notes" name="notes" disabled={isPending} />
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
