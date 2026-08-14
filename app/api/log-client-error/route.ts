import { NextResponse } from "next/server";
import { z } from "zod";
import { reportError } from "@/lib/observability/error-reporting";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  message: z.string().max(2000),
  digest: z.string().max(200).optional(),
  stack: z.string().max(8000).optional(),
  scope: z.enum(["public", "admin"]),
});

/**
 * Recibe errores capturados por los `error.tsx` del lado del cliente
 * (sección 12 del plan) y los reenvía a `reportError` — el único punto
 * donde el reporte llega a los logs estructurados del servidor / Sentry.
 * Rate limit generoso (un usuario real no debería disparar decenas de
 * errores por minuto; si lo hace, igual queremos el primero) para evitar
 * que un bucle de errores en el navegador de alguien inunde los logs.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`log-client-error:${ip}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await reportError(new Error(parsed.data.message), {
    digest: parsed.data.digest,
    stack: parsed.data.stack,
    scope: parsed.data.scope,
    source: "client-error-boundary",
  });

  return NextResponse.json({ ok: true });
}
