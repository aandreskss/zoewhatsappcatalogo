"use client";

import * as React from "react";
import { updateProductStatus } from "@/app/admin/(protected)/productos/actions";

const OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "hidden", label: "Oculto" },
  { value: "archived", label: "Archivado" },
];

export function StatusSelect({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(() => {
          void updateProductStatus(productId, next);
        });
      }}
      className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
