/**
 * Reporta un error atrapado por un `error.tsx` del lado del cliente
 * (sección 12 del plan). Primero al console del navegador (siempre
 * visible en devtools, útil incluso sin nada más configurado) y después,
 * sin bloquear el render, al endpoint `/api/log-client-error` para que
 * quede en los logs estructurados del servidor (y en Sentry si está
 * configurado — ver `lib/observability/error-reporting.ts`).
 *
 * Sin `import "server-only"` a propósito: este módulo se importa desde
 * Client Components (`error.tsx`), nunca desde código de servidor.
 */
export function reportClientError(
  error: Error & { digest?: string },
  scope: "public" | "admin",
): void {
  console.error(error);

  void fetch("/api/log-client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      scope,
    }),
  }).catch(() => {
    // Si ni siquiera se pudo mandar el reporte, no hay nada más que
    // hacer del lado del cliente — no re-lanzar (ya estamos dentro de un
    // error boundary) ni molestar al usuario con un segundo error.
  });
}
