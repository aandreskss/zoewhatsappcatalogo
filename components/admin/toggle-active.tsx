"use client";

import * as React from "react";

export function ToggleActive({
  id,
  active,
  action,
  labelOn = "Activa",
  labelOff = "Inactiva",
}: {
  id: string;
  active: boolean;
  action: (id: string, active: boolean) => Promise<void>;
  labelOn?: string;
  labelOff?: string;
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
      {active ? labelOn : labelOff}
    </label>
  );
}
