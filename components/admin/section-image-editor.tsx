"use client";

import { useState, useTransition } from "react";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/storage/upload";
import { updateHomeSectionImageUrl } from "@/app/admin/(protected)/marketing/home/actions";

interface Props {
  id: string;
  imageUrl: string | null;
}

export function SectionImageEditor({ id, imageUrl: initialImageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialImageUrl);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPreview(url);
      setSaved(false);
      startTransition(async () => {
        await updateHomeSectionImageUrl(id, url);
        setSaved(true);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setSaved(false);
    startTransition(async () => {
      await updateHomeSectionImageUrl(id, "");
      setSaved(true);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[#7B1847] hover:opacity-70 transition-opacity"
      >
        {preview ? "Cambiar imagen" : "Subir imagen"}
      </button>
    );
  }

  const busy = isPending || uploading;

  return (
    <div className="mt-1 flex flex-col gap-3 rounded-xl border border-[#EBE0E7] bg-[#FDF8FB] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#29252A]/40">
          Imagen de la sección
        </p>
        <div className="flex items-center gap-3">
          {saved && !busy && (
            <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
          )}
          {busy && (
            <span className="text-xs text-[#29252A]/50">Guardando…</span>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-[#29252A]/50 hover:text-[#29252A] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {preview ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-[#EBE0E7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-52 w-full object-contain" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            busy
              ? "cursor-not-allowed opacity-50 border-[#EBE0E7]"
              : "border-[#EBE0E7] hover:border-[#7B1847]/50 hover:bg-[#F0D8E8]/20"
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B1847] border-t-transparent" />
              <span className="text-sm text-[#29252A]/50">Subiendo imagen…</span>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7B1847]/10">
                <Upload size={20} className="text-[#7B1847]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#29252A]">
                  Haz clic para seleccionar una imagen
                </p>
                <p className="mt-0.5 text-xs text-[#29252A]/50">
                  JPG, PNG, WEBP · máx. 10 MB · 16:9 recomendado
                </p>
              </div>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
