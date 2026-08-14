"use client";

import { useActionState, useRef, useState } from "react";
import {
  addImageAction,
  type FormState,
} from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { isCloudinaryConfigured } from "@/lib/cloudinary/upload";

const initialState: FormState = { error: null };

export function AddImageForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addImageAction.bind(null, productId),
    initialState,
  );
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(!isCloudinaryConfigured());

  function handleUpload(url: string) {
    if (urlInputRef.current) urlInputRef.current.value = url;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">Agregar imagen</p>

      {/* Uploader */}
      <ImageUpload
        label="Imagen del producto"
        onUpload={handleUpload}
        disabled={isPending}
      />

      {/* Input de URL oculto (requerido por la Server Action) */}
      <input
        ref={urlInputRef}
        name="url"
        type="url"
        required
        className="hidden"
      />

      {/* Fallback: URL manual (toggle) */}
      {isCloudinaryConfigured() && (
        <button
          type="button"
          onClick={() => setShowUrlFallback((v) => !v)}
          className="self-start text-xs text-[var(--color-muted-foreground)] underline"
        >
          {showUrlFallback ? "Ocultar campo de URL" : "O pegar una URL directamente"}
        </button>
      )}

      {showUrlFallback && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="url-manual">URL de imagen</Label>
          <Input
            id="url-manual"
            type="url"
            disabled={isPending}
            onChange={(e) => {
              if (urlInputRef.current) urlInputRef.current.value = e.target.value;
            }}
            placeholder="https://…"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="altText">Texto alternativo (accesibilidad)</Label>
        <Input
          id="altText"
          name="altText"
          required
          disabled={isPending}
          placeholder="Ej: Sandalia beige talla 38"
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending} className="self-start">
        {isPending ? "Agregando…" : "Agregar imagen"}
      </Button>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
