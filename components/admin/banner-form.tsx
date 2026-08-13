"use client";

import { useActionState } from "react";
import {
  createBanner,
  type FormState,
} from "@/app/admin/(protected)/marketing/banners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function BannerForm() {
  const [state, formAction, isPending] = useActionState(createBanner, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Nombre interno</Label>
          <Input id="name" name="name" required disabled={isPending} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="position">Posición</Label>
          <Input
            id="position"
            name="position"
            defaultValue="home"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="imageDesktopUrl">Imagen escritorio (URL)</Label>
          <Input
            id="imageDesktopUrl"
            name="imageDesktopUrl"
            type="url"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="imageMobileUrl">Imagen móvil (URL)</Label>
          <Input
            id="imageMobileUrl"
            name="imageMobileUrl"
            type="url"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="headline">Titular</Label>
          <Input id="headline" name="headline" disabled={isPending} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="priority">Prioridad (mayor = primero)</Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            defaultValue={0}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ctaLabel">Texto del botón</Label>
          <Input id="ctaLabel" name="ctaLabel" disabled={isPending} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ctaUrl">Enlace del botón</Label>
          <Input id="ctaUrl" name="ctaUrl" placeholder="/catalogo" disabled={isPending} />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Crear banner"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
