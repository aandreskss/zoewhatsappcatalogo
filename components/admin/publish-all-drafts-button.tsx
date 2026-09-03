"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { publishAllDraftProductsAction } from "@/app/admin/(protected)/productos/actions";

export function PublishAllDraftsButton({ draftCount }: { draftCount: number }) {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [published, setPublished] = useState(0);
  const [isPending, startTransition] = useTransition();

  if (draftCount === 0) return null;

  function handleConfirm() {
    startTransition(async () => {
      const count = await publishAllDraftProductsAction();
      setPublished(count);
      setStep("done");
      setTimeout(() => setStep("idle"), 3000);
    });
  }

  if (step === "done") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
        <CheckCheck size={14} />
        {published} publicado{published !== 1 ? "s" : ""}
      </span>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-[#EBE4E1] bg-white px-3 py-2 text-xs">
        <span className="text-[#29252A]/70">¿Publicar {draftCount} borradores?</span>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
        >
          {isPending ? "Publicando…" : "Sí"}
        </button>
        <span className="text-[#29252A]/30">·</span>
        <button
          onClick={() => setStep("idle")}
          disabled={isPending}
          className="text-[#29252A]/50 hover:text-[#29252A] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="flex items-center gap-1.5 rounded-lg border border-[#EBE4E1] bg-white px-3 py-2 text-xs font-semibold text-[#29252A]/70 hover:border-[#7B1847]/40 hover:text-[#7B1847] transition-colors"
    >
      <CheckCheck size={14} />
      Publicar {draftCount} borrador{draftCount !== 1 ? "es" : ""}
    </button>
  );
}
