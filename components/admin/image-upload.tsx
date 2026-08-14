"use client";

import { useRef, useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { uploadImage } from "@/lib/storage/upload";

interface Props {
  onUpload: (url: string) => void;
  label?: string;
  previewUrl?: string;
  disabled?: boolean;
  aspectHint?: string;
}

export function ImageUpload({
  onUpload,
  label,
  previewUrl,
  disabled,
  aspectHint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPreview(url);
      onUpload(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onUpload("");
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
      )}

      {preview ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-52 w-full object-contain" />
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
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-muted)]"
          }`}
        >
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Subiendo imagen…</span>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <Upload size={20} className="text-[var(--color-primary)]" />
              </div>
              <div>
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
        <p className="flex items-start gap-1.5 text-xs text-[var(--color-error)]">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
