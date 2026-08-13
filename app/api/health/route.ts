import { NextResponse } from "next/server";

/**
 * Health check simple, sin datos sensibles, útil para observabilidad
 * (uptime checks) desde la Fase 0 en vez de dejarlo para el final.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "zoe-catalog",
    timestamp: new Date().toISOString(),
  });
}
