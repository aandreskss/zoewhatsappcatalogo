"use client";

import { useActionState, useRef, useState } from "react";
import {
  addImageAction,
  type FormState,
} from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary/upload";

const initialState: FormState = { error: null };

/**
 * Agrega una imagen por URL — con un botón opcional de "Subir imagen" que
 * la sube directo a Cloudinary desde el navegador (unsigned upload, ver
 * `lib/cloudinary/upload.ts`) y autocompleta el campo de URL. Si
 * Cloudinary no está configurado (faltan las variables de entorno), el
 * botón de subida ni siquiera se muestra — pegar una URL a mano sigue
 * funcionando igual que antes, no es un cambio disruptivo.
 */
export function AddImageForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addImageAction.bind(null, productId),
    initialState,
  );
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo si la subida anterior falló.
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      if (urlInputRef.current) urlInputRef.current.value = url;
      setPreview(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {isCloudinaryConfigured() ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="cloudinary-file">Subir imagen</Label>
          <input
            id="cloudinary-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading || isPending}
            className="text-sm"
          />
          {isUploading ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">Subiendo…</p>
          ) : null}
          {uploadError ? (
            <p className="text-xs text-[var(--color-error)]">{uploadError}</p>
          ) : null}
          {preview ? (
            // `<img>` normal a propósito: es una vista previa de una URL
            // remota recién subida, no una imagen del propio catálogo que
            // deba pasar por la optimización de `next/image`.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-12 w-12 rounded-[var(--radius-sm)] object-cover"
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="url">URL de imagen</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required
          disabled={isPending}
          ref={urlInputRef}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="altText">Texto alternativo</Label>
        <Input id="altText" name="altText" required disabled={isPending} />
      </div>
      <Button type="submit" size="sm" disabled={isPending || isUploading}>
        {isPending ? "Agregando…" : "Agregar imagen"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
