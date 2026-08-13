import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAttribution } from "@/lib/attribution";
import type { AnalyticsEventType } from "@/lib/analytics/event-types";
import type { Json } from "@/lib/db/supabase/types";

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  clientEventId: string;
  sessionId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  customerId?: string;
}

/**
 * Inserta un evento de analítica (sección 21 del plan) con la Service
 * Role Key (`analytics_events` no tiene policy de insert anon — mismo
 * patrón que `search_logs`). La atribución (UTMs/referrer) se adjunta
 * automáticamente desde la cookie de first-touch, nunca desde lo que
 * mande el cliente en el body — evita que alguien falsifique la fuente
 * de tráfico de un evento.
 *
 * Deduplicación: `client_event_id` es único en la tabla; un reintento
 * (ej. doble disparo de un efecto en React) que reenvíe el mismo id
 * simplemente no inserta una fila duplicada — se trata como éxito, no
 * como error.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  const attribution = await getAttribution();
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("analytics_events").insert({
    client_event_id: input.clientEventId,
    event_type: input.eventType,
    session_id: input.sessionId,
    customer_id: input.customerId ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as Json,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    referrer: attribution?.referrer ?? null,
  });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation (client_event_id repetido) — deduplicación
    // esperada, no un error real. Cualquier otro error se registra pero
    // nunca debe tumbar la petición del usuario que disparó el evento.
    console.error("[analytics] error al insertar evento:", error.message);
  }
}
