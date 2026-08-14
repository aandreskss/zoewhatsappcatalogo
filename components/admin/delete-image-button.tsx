"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteImageAction } from "@/app/admin/(protected)/productos/actions";

export function DeleteImageButton({
  imageId,
  productId,
}: {
  imageId: string;
  productId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta imagen?")) return;
    startTransition(async () => {
      await deleteImageAction(imageId, productId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Eliminar imagen"
      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-40"
    >
      <X size={11} />
    </button>
  );
}
