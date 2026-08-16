"use client";

import { useTransition, useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
  action: (id: string) => Promise<void>;
}

export function DeleteItemButton({ id, action }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-xs text-red-600">¿Eliminar?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            startTransition(() => { void action(id); });
          }}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={isPending}
      title="Eliminar"
      className="shrink-0 rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  );
}
