"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  saveTheme,
  type FormState,
} from "@/app/admin/(protected)/apariencia/branding/actions";
import { RADIUS_PRESETS, type SafeThemeTokens } from "@/lib/domain/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const initialState: FormState = { error: null };

/**
 * Selectores de color nativos (`<input type="color">`) en vez de un campo
 * de texto libre: el navegador siempre devuelve un hex válido, así que no
 * hay forma de mandar CSS arbitrario aunque alguien manipule el HTML del
 * formulario — la validación server-side en `actions.ts` es la defensa
 * real, esto es solo para que la UI nunca ofrezca algo inválido.
 */
export function BrandingForm({ current }: { current: SafeThemeTokens }) {
  const [state, formAction, isPending] = useActionState(saveTheme, initialState);
  const toast = useToast();
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    // Se disparó un submit (isPending pasó de true a false) y no quedó
    // error: fue exitoso. `useActionState` no da un "fue exitoso" directo,
    // así que se infiere del flanco de bajada de `isPending`.
    if (wasPending.current && !isPending && !state.error) {
      toast("Branding guardado.", "success");
    }
    wasPending.current = isPending;
  }, [isPending, state.error, toast]);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <ColorField
        name="colorPrimary"
        label="Color primario"
        defaultValue={current.colorPrimary}
        disabled={isPending}
      />
      <ColorField
        name="colorSecondary"
        label="Color secundario"
        defaultValue={current.colorSecondary}
        disabled={isPending}
      />
      <ColorField
        name="colorAccent"
        label="Color de acento"
        defaultValue={current.colorAccent}
        disabled={isPending}
      />

      <div className="flex flex-col gap-1">
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

function ColorField({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={name}
          name={name}
          defaultValue={defaultValue}
          disabled={disabled}
          className="h-11 w-16 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)]"
        />
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {defaultValue}
        </span>
      </div>
    </div>
  );
}
