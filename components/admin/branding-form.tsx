"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  saveTheme,
  type FormState,
} from "@/app/admin/(protected)/apariencia/branding/actions";
import { RADIUS_PRESETS, type SafeThemeTokens } from "@/lib/domain/theme-shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ColorPickerField } from "@/components/ui/color-picker-field";
import { useToast } from "@/components/ui/toast";

const initialState: FormState = { error: null };

export function BrandingForm({ current }: { current: SafeThemeTokens }) {
  const [state, formAction, isPending] = useActionState(saveTheme, initialState);
  const toast = useToast();
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      toast("Branding guardado.", "success");
    }
    wasPending.current = isPending;
  }, [isPending, state.error, toast]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-4">
        <ColorPickerField
          name="colorPrimary"
          label="Color primario"
          defaultValue={current.colorPrimary}
          disabled={isPending}
        />
        <ColorPickerField
          name="colorSecondary"
          label="Color secundario"
          defaultValue={current.colorSecondary}
          disabled={isPending}
        />
        <ColorPickerField
          name="colorAccent"
          label="Color de acento"
          defaultValue={current.colorAccent}
          disabled={isPending}
        />
        <ColorPickerField
          name="colorBackground"
          label="Color de fondo"
          defaultValue={current.colorBackground}
          disabled={isPending}
        />
        <ColorPickerField
          name="colorForeground"
          label="Color de texto principal"
          defaultValue={current.colorForeground}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="radius">Radio de bordes</Label>
        <select
          id="radius"
          name="radius"
          defaultValue={current.radius}
          disabled={isPending}
          className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
        >
          {Object.entries(RADIUS_PRESETS).map(([value, preset]) => (
            <option key={value} value={value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Guardar branding"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
