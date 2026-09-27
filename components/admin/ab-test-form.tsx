"use client";

import * as React from "react";
import { useActionState } from "react";
import { saveABTest, type ABTestFormState } from "@/app/admin/(protected)/marketing/ab-test/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { ABTestConfig } from "@/lib/domain/ab-test";

const initialState: ABTestFormState = { error: null };

export function ABTestForm({ current }: { current: ABTestConfig }) {
  const [state, formAction, isPending] = useActionState(saveABTest, initialState);
  const toast = useToast();
  const wasPending = React.useRef(false);
  const [enabled, setEnabled] = React.useState(current.enabled);
  const [percentage, setPercentage] = React.useState(current.percentage);

  React.useEffect(() => {
    if (wasPending.current && !isPending) {
      if (!state.error) toast("Configuración guardada.", "success");
      else toast(state.error, "error");
    }
    wasPending.current = isPending;
  }, [isPending, state.error, toast]);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-8">

      {/* ── Toggle ── */}
      <section className="flex flex-col gap-4">
        <h2 className="border-b border-[var(--color-border)] pb-2 text-base font-semibold">
          Estado
        </h2>

        <input type="hidden" name="enabled" value={String(enabled)} />

        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
          }`}
          aria-pressed={enabled}
          disabled={isPending}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>

        <p className="text-sm text-[var(--color-muted-foreground)]">
          {enabled
            ? "✅ Prueba A/B activa — el tráfico se divide según el porcentaje configurado."
            : "⏸ Prueba A/B inactiva — todos los visitantes ven el catálogo."}
        </p>
      </section>

      {/* ── URL de la landing ── */}
      <section className="flex flex-col gap-4">
        <h2 className="border-b border-[var(--color-border)] pb-2 text-base font-semibold">
          Landing page (variante B)
        </h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lpUrl">URL de la landing page</Label>
          <Input
            id="lpUrl"
            name="lpUrl"
            type="text"
            defaultValue={current.lpUrl}
            placeholder="/lp/promo50"
            disabled={isPending}
            className="font-mono"
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Debe comenzar con <code>/</code>. Ej: <code>/lp/promo50</code>
          </p>
        </div>
      </section>

      {/* ── Porcentaje ── */}
      <section className="flex flex-col gap-4">
        <h2 className="border-b border-[var(--color-border)] pb-2 text-base font-semibold">
          Distribución del tráfico
        </h2>

        <input type="hidden" name="percentage" value={percentage} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Catálogo (A): <strong>{100 - percentage}%</strong></span>
            <span>Landing (B): <strong>{percentage}%</strong></span>
          </div>

          <input
            type="range"
            min={1}
            max={99}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            disabled={isPending}
            className="w-full accent-[var(--color-primary)]"
          />

          <div className="flex items-center gap-3">
            <Label htmlFor="pct-number" className="shrink-0 text-sm">
              % enviado a la landing:
            </Label>
            <Input
              id="pct-number"
              type="number"
              min={1}
              max={99}
              value={percentage}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= 99) setPercentage(v);
              }}
              disabled={isPending}
              className="w-20 text-center"
            />
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)]">
            De cada 100 nuevos visitantes, <strong>{percentage}</strong> verán la landing page
            y <strong>{100 - percentage}</strong> verán el catálogo. Los visitantes
            recurrentes mantienen su variante durante 30 días.
          </p>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </form>
  );
}
