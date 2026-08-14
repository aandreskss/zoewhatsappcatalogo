"use client";

import { useActionState } from "react";
import {
  verifyMfaChallenge,
  type ChallengeState,
} from "@/app/admin/mfa/challenge/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChallengeState = { error: null };

export function MfaChallengeForm() {
  const [state, formAction, isPending] = useActionState(verifyMfaChallenge, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Código de 6 dígitos</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Verificando…" : "Verificar"}
      </Button>
    </form>
  );
}
