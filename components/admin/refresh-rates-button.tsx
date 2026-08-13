"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { refreshRatesNow } from "@/app/admin/(protected)/finanzas/monedas/actions";
import { Button } from "@/components/ui/button";

export function RefreshRatesButton() {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await refreshRatesNow();
            if (result.error) setError(result.error);
            router.refresh();
          });
        }}
      >
        {isPending ? "Consultando…" : "Actualizar tasa automática ahora"}
      </Button>
      {error ? <p className="text-xs text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
