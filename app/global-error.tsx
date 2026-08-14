"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/report-client-error";

/**
 * Último recurso de error boundary (sección 12 del plan) — captura
 * errores que ocurren en `app/layout.tsx` mismo (ej. que la consulta del
 * theme activo en Supabase falle de una forma no contemplada por
 * `getActiveTheme`, que ya falla a `null` en silencio pero no puede
 * cubrir un error de red/config a nivel de cliente Supabase). Reemplaza
 * el `<html>`/`<body>` completo mientras está activo — por eso NO puede
 * asumir que `globals.css` o los tokens de `app/layout.tsx` se cargaron,
 * y usa estilos inline en vez de clases de Tailwind/variables CSS
 * (recomendación oficial de Next.js para este archivo específico, no un
 * descuido de estilo).
 */
export default function GlobalError({
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
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Algo salió mal</h1>
          <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "#666" }}>
            Tuvimos un problema cargando el sitio. Este error queda registrado en los logs
            del sistema — intenta de nuevo en unos segundos.
          </p>
          <button
            onClick={() => reset()}
            style={{
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "white",
            }}
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
