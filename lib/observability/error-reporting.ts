import "server-only";
import { logger, redactSensitive } from "@/lib/observability/logger";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import type { Json } from "@/lib/db/supabase/types";

/**
 * Punto de integración OPCIONAL con Sentry (sección 12 del plan — Fase 12
 * alcance "solo código": este sandbox no tiene una cuenta/DSN de Sentry
 * real). A propósito, este proyecto NO agrega `@sentry/nextjs` como
 * dependencia incondicional: instalar y envolver `next.config.ts` con su
 * plugin de webpack es una integración que no se puede verificar aquí
 * (no hay forma de correr `next build` en este sandbox — ver
 * `tests/README.md` — y menos aún confirmar que el envío a Sentry
 * funciona sin un DSN real). Fingir que esa integración ya está
 * completa y probada sería peor que no tenerla.
 *
 * En su lugar, este módulo deja el ENGANCHE listo y sin efecto por
 * defecto: si `SENTRY_DSN` está configurado Y el paquete `@sentry/nextjs`
 * ya se instaló (pasos exactos en `docs/runbook-lanzamiento.md`), se usa.
 * Si falta cualquiera de los dos, se degrada a logging estructurado
 * normal — nunca rompe el request que disparó el error original.
 */
let warnedMissingPackage = false;

/**
 * Guarda el error en `error_reports` (migración 0021) para que el panel
 * de salud del admin (`/admin/salud`) tenga algo que mostrar aunque
 * Sentry nunca se configure. Best-effort a propósito — igual que
 * `cron-log.ts`, un fallo al PERSISTIR el reporte nunca debe generar un
 * segundo error ni afectar el manejo del error original.
 */
async function persistErrorReport(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const rawScope = context?.scope;
    const scope = rawScope === "public" || rawScope === "admin" ? rawScope : "server";
    const rawDigest = context?.digest;

    await supabase.from("error_reports").insert({
      scope,
      message: error instanceof Error ? error.message : String(error),
      digest: typeof rawDigest === "string" ? rawDigest : null,
      stack: error instanceof Error ? (error.stack ?? null) : null,
      context: context ? (redactSensitive(context) as Json) : null,
    });
  } catch {
    // Sin credenciales de Supabase reales (ej. este sandbox) o cualquier
    // otro fallo de red/DB, simplemente no queda el registro — el error
    // original ya se logueó por consola de todas formas.
  }
}

export async function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  await persistErrorReport(error, context);

  const dsn = process.env.SENTRY_DSN;

  if (dsn) {
    // Nombre del paquete detrás de una variable, no de un string literal
    // en el propio `import()`, a propósito: así TypeScript no intenta
    // resolver sus tipos en build time (el paquete puede no estar
    // instalado todavía) y el `catch` de abajo maneja el caso real de
    // "no está instalado" en vez de que `tsc`/`next build` fallen.
    const sentryPackageName = "@sentry/nextjs";
    try {
      const Sentry = await import(sentryPackageName);
      Sentry.captureException(error, { extra: context });
      return;
    } catch (importError) {
      if (!warnedMissingPackage) {
        warnedMissingPackage = true;
        logger.warn(
          "SENTRY_DSN está configurado pero @sentry/nextjs no está instalado — instala el paquete para activar el reporte de errores (ver docs/runbook-lanzamiento.md).",
          {
            importError:
              importError instanceof Error ? importError.message : String(importError),
          },
        );
      }
    }
  }

  logger.error(error instanceof Error ? error.message : "Error no controlado", {
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
