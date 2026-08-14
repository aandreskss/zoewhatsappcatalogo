"use client";

import { useActionState, useRef } from "react";
import {
  createBanner,
  type FormState,
} from "@/app/admin/(protected)/marketing/banners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { isCloudinaryConfigured } from "@/lib/cloudinary/upload";

const initialState: FormState = { error: null };

export function BannerForm() {
  const [state, formAction, isPending] = useActionState(createBanner, initialState);
  const desktopUrlRef = useRef<HTMLInputElement>(null);
  const mobileUrlRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-white p-5"
    >
      <p className="font-semibold text-[var(--color-foreground)]">Nuevo banner</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Nombre interno</Label>
          <Input id="name" name="name" required disabled={isPending} placeholder="Banner verano 2025" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="position">Posición</Label>
          <select
            id="position"
            name="position"
            defaultValue="home"
            disabled={isPending}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            <option value="home">Home principal</option>
            <option value="home_secondary">Home secundario</option>
            <option value="catalog_top">Catálogo (arriba)</option>
          </select>
        </div>
      </div>

      {/* Imágenes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {isCloudinaryConfigured() ? (
            <>
              <ImageUpload
                label="Imagen escritorio"
                onUpload={(url) => { if (desktopUrlRef.current) desktopUrlRef.current.value = url; }}
                disabled={isPending}
                aspectHint="16:5 recomendado"
              />
              <input ref={desktopUrlRef} name="imageDesktopUrl" type="url" className="hidden" />
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <Label htmlFor="imageDesktopUrl">Imagen escritorio (URL)</Label>
              <Input id="imageDesktopUrl" name="imageDesktopUrl" type="url" disabled={isPending} placeholder="https://…" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isCloudinaryConfigured() ? (
            <>
              <ImageUpload
                label="Imagen móvil"
                onUpload={(url) => { if (mobileUrlRef.current) mobileUrlRef.current.value = url; }}
                disabled={isPending}
                aspectHint="4:5 recomendado"
              />
              <input ref={mobileUrlRef} name="imageMobileUrl" type="url" className="hidden" />
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <Label htmlFor="imageMobileUrl">Imagen móvil (URL)</Label>
              <Input id="imageMobileUrl" name="imageMobileUrl" type="url" disabled={isPending} placeholder="https://…" />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="headline">Titular (opcional)</Label>
          <Input id="headline" name="headline" disabled={isPending} placeholder="Nueva colección" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="priority">Prioridad (mayor = primero)</Label>
          <Input id="priority" name="priority" type="number" defaultValue={0} disabled={isPending} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ctaLabel">Texto del botón</Label>
          <Input id="ctaLabel" name="ctaLabel" disabled={isPending} placeholder="Ver colección" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ctaUrl">Enlace del botón</Label>
          <Input id="ctaUrl" name="ctaUrl" disabled={isPending} placeholder="/catalogo" />
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
