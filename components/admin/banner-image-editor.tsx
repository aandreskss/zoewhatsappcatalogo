"use client";

import { useState, useTransition } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { updateBannerImages } from "@/app/admin/(protected)/marketing/banners/actions";

interface Props {
  id: string;
  desktopUrl: string | null;
  mobileUrl: string | null;
}

export function BannerImageEditor({ id, desktopUrl, mobileUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(desktopUrl);
  const [mobile, setMobile] = useState(mobileUrl);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleUpload(field: "desktop" | "mobile", url: string) {
    const newDesktop = field === "desktop" ? url || null : desktop;
    const newMobile = field === "mobile" ? url || null : mobile;
    if (field === "desktop") setDesktop(url || null);
    else setMobile(url || null);
    setSaved(false);
    startTransition(async () => {
      await updateBannerImages(id, newDesktop, newMobile);
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
        {desktop || mobile ? "Cambiar imágenes" : "Subir imágenes"}
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-4 rounded-xl border border-[#EBE0E7] bg-[#FDF8FB] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#29252A]/40">
          Imágenes del banner
        </p>
        <div className="flex items-center gap-3">
          {saved && !isPending && (
            <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
          )}
          {isPending && (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload
          label="Escritorio"
          previewUrl={desktop ?? undefined}
          onUpload={(url) => handleUpload("desktop", url)}
          disabled={isPending}
          aspectHint="16:5 recomendado"
        />
        <ImageUpload
          label="Móvil"
          previewUrl={mobile ?? undefined}
          onUpload={(url) => handleUpload("mobile", url)}
          disabled={isPending}
          aspectHint="4:5 recomendado"
        />
      </div>
    </div>
  );
}
