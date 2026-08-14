"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/report-client-error";
import { Button } from "@/components/ui/button";

/**
 * Error boundary del panel admin (sección 12 del plan). Cubre
 * `/admin/login` y todo `(protected)/**` — incluye errores del layout de
 * `(protected)` (ej. una consulta a Supabase que falle al resolver rol o
 * estado de 2FA), porque ese layout es un segmento ANIDADO respecto a
 * este archivo (comportamiento documentado de Next.js App Router: un
 * `error.tsx` no atrapa errores de su PROPIO `layout.tsx`, pero sí los de
 * layouts/páginas hijas).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "admin");
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal en el panel</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        Ocurrió un error inesperado. Este error queda registrado en los logs del sistema.
      </p>
      <Button onClick={() => reset()}>Intentar de nuevo</Button>
    </main>
  );
}
