"use client";

import { useActionState } from "react";
import {
  setManualExchangeRate,
  type FormState,
} from "@/app/admin/(protected)/finanzas/monedas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function ManualRateForm() {
  const [state, formAction, isPending] = useActionState(
    setManualExchangeRate,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="pair">Par</Label>
        <select
          id="pair"
          name="pair"
          disabled={isPending}
          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm"
        >
          <option value="USD/VES">USD/VES</option>
          <option value="EUR/VES">EUR/VES</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="rate">Tasa (Bs por unidad)</Label>
        <Input
          id="rate"
          name="rate"
          type="number"
          step="0.0001"
          min="0"
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar tasa manual"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
