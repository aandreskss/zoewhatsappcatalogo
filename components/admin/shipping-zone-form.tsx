"use client";

import { useActionState } from "react";
import {
  createShippingZone,
  type FormState,
} from "@/app/admin/(protected)/entrega/delivery/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function ShippingZoneForm() {
  const [state, formAction, isPending] = useActionState(createShippingZone, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Zona</Label>
        <Input
          id="name"
          name="name"
          placeholder="Valencia Norte"
          required
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="city">Ciudad</Label>
        <Input id="city" name="city" placeholder="Valencia" disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="costUsd">Costo (USD)</Label>
        <Input
          id="costUsd"
          name="costUsd"
          type="number"
          step="0.01"
          min="0"
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Crear zona"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
