"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setVesReferenceCurrency } from "@/app/admin/(protected)/finanzas/monedas/actions";

export function ReferenceCurrencySelect({ value }: { value: "USD" | "EUR" }) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          await setVesReferenceCurrency(next);
          router.refresh();
        });
      }}
      className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm"
    >
      <option value="USD">USD (recomendado)</option>
      <option value="EUR">EUR</option>
    </select>
  );
}
