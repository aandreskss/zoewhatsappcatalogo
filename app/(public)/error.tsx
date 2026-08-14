"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/observability/report-client-error";

/**
 * Error boundary del sitio público (sección 12 del plan). Captura errores
 * de render en cualquier página bajo `app/(public)/**` — NO los del
 * propio `app/(public)/layout.tsx` (esos los atrapa `app/global-error.tsx`,
 * comportamiento documentado de Next.js App Router).
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "public");
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        Tuvimos un problema mostrando esta página. Este error queda registrado en los logs
        del sistema — puedes intentar de nuevo o volver al catálogo.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Intentar de nuevo</Button>
        <Button asChild variant="outline">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
