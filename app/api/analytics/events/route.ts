import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENT_TYPES } from "@/lib/analytics/event-types";
import { trackEvent } from "@/lib/domain/analytics";
import { getOrCreateCartSessionId } from "@/lib/cart/session-cookie";

const bodySchema = z.object({
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  clientEventId: z.string().uuid(),
  entityType: z.string().max(60).optional(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Endpoint público de tracking desde el cliente (sección 21 del plan).
 * `session_id` se resuelve del lado servidor a partir de la cookie
 * httpOnly del carrito — nunca se confía en un session_id que mande el
 * body, para que un evento no pueda falsificarse como perteneciente a
 * otra sesión.
 */
export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sessionId = await getOrCreateCartSessionId();

  await trackEvent({
    eventType: parsed.data.eventType,
    clientEventId: parsed.data.clientEventId,
    sessionId,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    metadata: parsed.data.metadata,
  });

  return NextResponse.json({ ok: true });
}
