import "server-only";

/**
 * Rate limiting en memoria (sección 23 del plan: "rate limiting en
 * endpoints públicos sensibles — creación de pedidos, búsqueda, login —
 * para mitigar spam/bots"). Deliberadamente NO usa Redis/Upstash: este
 * proyecto no tiene una cuenta de ese servicio configurada, y "inventar"
 * una dependencia externa que no existe rompería la regla permanente de
 * no fingir integraciones (sección 26 del plan tampoco la lista).
 *
 * Limitación honesta documentada: en un despliegue serverless (Vercel)
 * con múltiples instancias frías, este `Map` vive por instancia, no es un
 * contador global compartido — un atacante distribuido en muchas
 * invocaciones frías podría eludirlo parcialmente. Para el volumen de
 * tráfico esperado de una tienda de calzado (no un ataque a escala), esto
 * ya frena el abuso casual/scripts simples, que es la amenaza real hoy.
 * Si el tráfico crece al punto de necesitar un límite estrictamente
 * global, la migración natural es Upstash Redis (`@upstash/ratelimit`)
 * manteniendo la misma firma de `checkRateLimit`.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Poda periódica para no acumular memoria indefinidamente en una instancia
// de servidor de larga duración (`next start`, no serverless).
const PRUNE_INTERVAL_MS = 5 * 60_000;
let lastPrune = Date.now();

function pruneIfDue(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Ventana fija (no sliding window) — más simple y suficiente aquí: cada
 * `key` tiene como máximo `limit` intentos por `windowMs`, y el contador
 * se reinicia entero al expirar la ventana.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneIfDue(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * IP del cliente desde los headers que pone el proxy de Vercel (`x-forwarded-for`)
 * — nunca de un header que el cliente pueda falsificar sin que pase por el
 * proxy real (`x-forwarded-for` lo sobrescribe Vercel, no lo respeta tal
 * cual del request entrante de internet). Fallback a "unknown" en vez de
 * lanzar: es mejor agrupar tráfico sin IP identificable bajo una sola
 * clave que romper el endpoint.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
