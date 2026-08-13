"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormState {
  error: string | null;
}

/**
 * Formulario de una sola línea (nombre → slug automático) reutilizado por
 * Categorías y Marcas — ambas tienen exactamente esta forma en la Fase 2.
 */
export function SimpleCreateForm({
  action,
  placeholder,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  placeholder: string;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex items-end gap-2">
      <Input name="name" placeholder={placeholder} required disabled={isPending} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : submitLabel}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
