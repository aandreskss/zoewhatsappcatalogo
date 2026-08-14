"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/(protected)/productos/actions";

export function DeleteProductButton({
  productId,
  productName,
  variant = "full",
}: {
  productId: string;
  productName: string;
  variant?: "full" | "icon";
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Eliminar "${productName}"?\nEsta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await deleteProduct(productId);
    });
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        title="Eliminar producto"
        className="rounded-lg p-1.5 text-[#29252A]/30 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
