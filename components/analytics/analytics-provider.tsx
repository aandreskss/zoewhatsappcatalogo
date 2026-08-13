"use client";

import * as React from "react";
import type { AnalyticsEventType } from "@/lib/analytics/event-types";

interface TrackOptions {
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

type TrackFn = (eventType: AnalyticsEventType, options?: TrackOptions) => void;

const AnalyticsContext = React.createContext<TrackFn | null>(null);

/**
 * `track()` dispara-y-olvida: nunca bloquea la UI ni afecta el flujo del
 * usuario si falla (sección 21 del plan — analítica es observabilidad,
 * no debe poder romper una compra). Cada llamada genera su propio
 * `clientEventId` (deduplicación server-side vía constraint único).
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const track = React.useCallback<TrackFn>((eventType, options) => {
    const clientEventId = crypto.randomUUID();
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        clientEventId,
        entityType: options?.entityType,
        entityId: options?.entityId,
        metadata: options?.metadata,
      }),
      keepalive: true,
    }).catch(() => {
      // Silencioso a propósito: un evento de analítica perdido nunca debe
      // mostrarle un error al cliente.
    });
  }, []);

  return <AnalyticsContext.Provider value={track}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): TrackFn {
  const track = React.useContext(AnalyticsContext);
  if (!track) throw new Error("useAnalytics debe usarse dentro de <AnalyticsProvider>");
  return track;
}
