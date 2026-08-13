"use client";

import { useActionState } from "react";
import {
  saveStoreDayHours,
  type FormState,
} from "@/app/admin/(protected)/entrega/horarios/actions";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

export function StoreHoursRow({
  storeId,
  dayOfWeek,
  dayLabel,
  opensAt,
  closesAt,
  closed,
}: {
  storeId: string;
  dayOfWeek: number;
  dayLabel: string;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveStoreDayHours, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] py-2 text-sm last:border-b-0"
    >
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
      <span className="w-24 shrink-0 font-medium">{dayLabel}</span>

      <label className="inline-flex items-center gap-1.5">
        <input
          type="checkbox"
          name="closed"
          defaultChecked={closed}
          disabled={isPending}
        />
        Cerrado
      </label>

      <input
        type="time"
        name="opensAt"
        defaultValue={opensAt ?? "09:00"}
        disabled={isPending}
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1"
      />
      <span className="text-[var(--color-muted-foreground)]">a</span>
      <input
        type="time"
        name="closesAt"
        defaultValue={closesAt ?? "18:00"}
        disabled={isPending}
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1"
      />

      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
      {state.error ? (
        <p className="w-full text-xs text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
