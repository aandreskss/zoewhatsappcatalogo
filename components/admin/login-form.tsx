"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignInState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signInWithPassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
