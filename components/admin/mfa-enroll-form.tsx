"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  startMfaEnrollment,
  verifyMfaEnrollment,
  type VerifyEnrollState,
} from "@/app/admin/mfa/enroll/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: VerifyEnrollState = { error: null };

interface Enrollment {
  factorId: string;
  qrCodeSvg: string;
  secret: string;
}

export function MfaEnrollForm() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isStarting, startEnrollTransition] = useTransition();
  const [state, formAction, isVerifying] = useActionState(
    verifyMfaEnrollment,
    initialState,
  );

  useEffect(() => {
    startEnrollTransition(async () => {
      const result = await startMfaEnrollment();
      if (result.ok) {
        setEnrollment({
          factorId: result.factorId,
          qrCodeSvg: result.qrCodeSvg,
          secret: result.secret,
        });
      } else {
        setEnrollError(result.error);
      }
    });
    // Se ejecuta una sola vez al montar: iniciar el enrolamiento crea un
    // factor TOTP nuevo en Supabase, no algo que deba repetirse en cada
    // re-render de este componente.
  }, []);

  if (enrollError) {
    return (
      <p role="alert" className="text-sm text-[var(--color-error)]">
        {enrollError}
      </p>
    );
  }

  if (isStarting || !enrollment) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">Generando código QR…</p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="factorId" value={enrollment.factorId} />

      {/* `<img>` normal a propósito, no `next/image`: es un data URI SVG
          generado en cada carga de esta pantalla (nunca el mismo archivo
          dos veces), así que no hay nada que `next/image` pueda optimizar
          u cachear — y usarlo como `src` (patrón recomendado por Supabase)
          evita además inyectar el SVG como HTML vía `dangerouslySetInnerHTML`. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf-8,${encodeURIComponent(enrollment.qrCodeSvg)}`}
        alt="Código QR para activar la verificación en dos pasos"
        className="mx-auto h-48 w-48"
      />

      <div className="flex flex-col gap-1 text-center">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          ¿No puedes escanear? Ingresa esta clave manualmente en tu app:
        </p>
        <code className="rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-2 py-1 text-xs break-all">
          {enrollment.secret}
        </code>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Código de 6 dígitos</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          disabled={isVerifying}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isVerifying}>
        {isVerifying ? "Verificando…" : "Activar 2FA"}
      </Button>
    </form>
  );
}
