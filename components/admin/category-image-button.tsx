"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, X } from "lucide-react";
import { uploadImage } from "@/lib/storage/upload";
import { updateCategoryImage } from "@/app/admin/(protected)/categorias/actions";

interface Props {
  categoryId: string;
  currentImageUrl: string | null;
}

export function CategoryImageButton({ categoryId, currentImageUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      startTransition(() => {
        void updateCategoryImage(categoryId, url);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setImageUrl(null);
    setError(null);
    startTransition(() => {
      void updateCategoryImage(categoryId, null);
    });
  }

  return (
    <div className="relative flex-none" title={error ?? "Imagen de categoría"}>
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#EBE0E7] bg-[#F0D8E8] flex items-center justify-center hover:border-[#7B1847]/50 transition-colors"
      >
        {uploading ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#7B1847] border-t-transparent animate-spin" />
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera size={14} className={error ? "text-red-500" : "text-[#7B1847]/50"} />
        )}
      </button>

      {imageUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          title="Quitar imagen"
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#29252A] text-white flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X size={8} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
