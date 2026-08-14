"use client";

import { useActionState } from "react";
import {
  saveIntegration,
  type FormState,
} from "@/app/admin/(protected)/integraciones/analytics/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function IntegrationForm({
  provider,
  label,
  fieldLabel,
  placeholder,
  currentValue,
  currentActive,
  activeLabel,
  hint,
}: {
  provider: "ga4" | "gtm" | "meta_pixel" | "tiktok" | "google_search_console";
  label: string;
  fieldLabel: string;
  placeholder: string;
  currentValue: string;
  currentActive: boolean;
  activeLabel?: string;
  hint?: string;
}) {
  const [state, formAction, isPending] = useActionState(saveIntegration, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
    >
      <input type="hidden" name="provider" value={provider} />
      <p className="font-medium">{label}</p>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${provider}-value`}>{fieldLabel}</Label>
        <Input
          id={`${provider}-value`}
          name="configValue"
          placeholder={placeholder}
          defaultValue={currentValue}
          disabled={isPending}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={currentActive}
          disabled={isPending}
        />
        {activeLabel ?? "Activa (carga el script en el sitio público)"}
      </label>

      {hint && (
        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{hint}</p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
