"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary/upload";

interface Props {
  onUpload: (url: string) => void;
  label?: string;
  previewUrl?: string;
  disabled?: boolean;
  aspectHint?: string; // ej. "16:9 recomendado"
}

export function ImageUpload({
  onUpload,
  label = "Subir imagen",
  previewUrl,
  disabled,
  aspectHint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const configured = isCloudinaryConfigured();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes (JPG, PNG, WEBP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera los 10 MB.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setPreview(url);
      onUpload(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUpload("");
  }

  if (!configured) return null;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
      )}

      {preview ? (
        /* Vista previa */
        <div className="relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-48 w-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Zona de drop */
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
            dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-muted)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Subiendo…</span>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <Upload size={20} className="text-[var(--color-primary)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  Haz clic o arrastra una imagen aquí
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  JPG, PNG, WEBP · máx. 10 MB{aspectHint ? ` · ${aspectHint}` : ""}
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-error)]">
          <ImageIcon size={12} />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
