"use client";

import { useActionState } from "react";
import {
  addVariantAction,
  type FormState,
} from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function AddVariantForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addVariantAction.bind(null, productId),
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 sm:grid-cols-3"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" required disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="color">Color</Label>
        <Input id="color" name="color" required disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="colorHex">Color (hex, opcional)</Label>
        <Input id="colorHex" name="colorHex" placeholder="#000000" disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="size">Talla</Label>
        <Input id="size" name="size" required disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="priceUsd">Precio USD</Label>
        <Input
          id="priceUsd"
          name="priceUsd"
          type="number"
          step="0.01"
          min="0"
          required
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="compareAtPriceUsd">Precio anterior (opcional)</Label>
        <Input
          id="compareAtPriceUsd"
          name="compareAtPriceUsd"
          type="number"
          step="0.01"
          min="0"
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p className="col-span-full text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}

      <div className="col-span-full">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Agregando…" : "Agregar variante"}
        </Button>
      </div>
    </form>
  );
}
