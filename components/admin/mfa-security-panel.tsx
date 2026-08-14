"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { unenrollMfaFactor } from "@/app/admin/(protected)/seguridad/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function MfaSecurityPanel({
  hasVerifiedFactor,
  isSessionVerified,
}: {
  hasVerifiedFactor: boolean;
  isSessionVerified: boolean;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  function confirmReset() {
    startTransition(async () => {
      try {
        await unenrollMfaFactor();
        setConfirmOpen(false);
        toast("2FA restablecido. Deberás enrolar un dispositivo nuevo.", "success");
        router.refresh();
      } catch (err) {
        setConfirmOpen(false);
        toast(
          err instanceof Error ? err.message : "No se pudo restablecer el 2FA",
          "error",
        );
      }
    });
  }

  if (!hasVerifiedFactor) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no activas la verificación en dos pasos en esta cuenta.
        </p>
        <Link
          href="/admin/mfa/enroll"
          className="w-fit rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
        >
          Activar 2FA
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        2FA activo en esta cuenta.{" "}
        {isSessionVerified
          ? "Esta sesión ya pasó el segundo factor."
          : "Esta sesión todavía no pasó el segundo factor."}
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-fit"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
      >
        Restablecer 2FA
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmReset}
        title="¿Restablecer la verificación en dos pasos?"
        description="Vas a desactivar el dispositivo actual. La próxima vez que entres al panel (o de inmediato, si tu rol lo exige) tendrás que enrolar uno nuevo."
        confirmLabel="Restablecer"
        isDangerous
        isPending={isPending}
      />
    </div>
  );
}
