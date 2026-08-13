"use client";

import { useActionState } from "react";
import {
  addImageAction,
  type FormState,
} from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

/**
 * Agrega una imagen por URL. La subida directa de archivos con
 * redimensionado/WebP/AVIF automático (sección 27/43 del plan) queda para
 * cuando se conecte Supabase Storage en un entorno real — aquí ya se deja
 * el modelo de datos (`product_images.url`) listo para apuntar a esa
 * fuente sin cambios.
 */
export function AddImageForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addImageAction.bind(null, productId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="url">URL de imagen</Label>
        <Input id="url" name="url" type="url" required disabled={isPending} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="altText">Texto alternativo</Label>
        <Input id="altText" name="altText" required disabled={isPending} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Agregando…" : "Agregar imagen"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
