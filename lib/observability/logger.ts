import "server-only";

/**
 * Logging estructurado (sección 12 del plan, Fase 12: "logging
 * estructurado sin datos sensibles"). Una línea de JSON por evento
 * (formato que cualquier agregador de logs — incluido el de Vercel —
 * puede parsear) en vez de `console.log` con texto libre, con redacción
 * automática de los campos más obvios que nunca deben aparecer en un log
 * (teléfonos, contraseñas, tokens, códigos 2FA) aunque quien llame a
 * `logger.*` se olvide de omitirlos a mano.
 */

type LogLevel = "info" | "warn" | "error";

const REDACTED = "[redactado]";

// Coincidencia por NOMBRE de clave, no de valor — más simple y más
// seguro por defecto que intentar reconocer patrones de teléfono/token
// en texto libre (que además cambian de formato por país/proveedor).
const SENSITIVE_KEY_PATTERN =
  /(phone|telefono|teléfono|password|contraseñ|token|secret|totp|code|codigo|código|dni|cedula|cédula|authorization)/i;

/**
 * Redacta recursivamente cualquier campo cuyo NOMBRE de clave luzca
 * sensible. Exportada (no solo de uso interno) para que
 * `error-reporting.ts` pueda aplicar la misma redacción antes de
 * persistir un reporte de error en `error_reports` — un solo lugar que
 * define "qué es sensible" para todo el módulo de observabilidad.
 */
export function redactSensitive(value: unknown, depth = 0): unknown {
  // Corta anidamiento absurdo (no un caso real esperado) en vez de
  // desbordar la pila con un objeto circular o mal formado.
  if (depth > 5) return REDACTED;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED
        : redactSensitive(val, depth + 1);
    }
    return out;
  }
  return value;
}

export interface LogContext {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: redactSensitive(context) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
