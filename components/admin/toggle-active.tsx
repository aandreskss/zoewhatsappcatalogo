"use client";

import * as React from "react";

export function ToggleActive({
  id,
  active,
  action,
}: {
  id: string;
  active: boolean;
  action: (id: string, active: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={active}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.checked;
          startTransition(() => {
            void action(id, next);
          });
        }}
      />
      {active ? "Activa" : "Inactiva"}
    </label>
  );
}
