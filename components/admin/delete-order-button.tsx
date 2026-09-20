"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteOrderAction } from "@/app/admin/(protected)/pedidos/actions";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function handleConfirm() {
    setStep("loading");
    setError(null);
    const result = await deleteOrderAction(orderId);
    if (result.error) {
      setError(result.error);
      setStep("confirm");
    } else {
      router.push("/admin/pedidos");
    }
  }

  if (step === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        Eliminar pedido
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-red-700 font-medium">
        ¿Eliminar este pedido? El inventario reservado o confirmado se restaurará.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={step === "loading"}
          className="rounded-[var(--radius-md)] bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {step === "loading" ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => { setStep("idle"); setError(null); }}
          disabled={step === "loading"}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
