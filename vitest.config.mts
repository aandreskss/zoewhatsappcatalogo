import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fase 11 del plan (Testing integral). Solo cubre `lib/domain/**` puro
 * (sin Next.js, sin Supabase) — las funciones exactas que la sección 33
 * pide como "Unit": pricing, ID de pedido/estado, mensaje de WhatsApp,
 * disponibilidad. Tests de integración contra una base de datos real
 * (checkout completo, idempotencia) requieren un proyecto Supabase de
 * pruebas que este sandbox no tiene — ver `tests/README.md`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "."),
      // Vitest corre en Node plano y no conoce la condición de exports
      // "react-server" que usa Next.js para resolver `server-only` a un
      // módulo vacío dentro de Server Components — sin este alias,
      // cualquier archivo de `lib/domain` que importe "server-only"
      // lanzaría al cargarlo en un test (ver node_modules/server-only/index.js).
      "server-only": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "node_modules/server-only/empty.js",
      ),
    },
  },
});
