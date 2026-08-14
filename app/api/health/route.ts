import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

/**
 * Health check público, sin datos sensibles (sección 12 del plan) —
 * pensado para un uptime monitor externo (ver `docs/runbook-lanzamiento.md`
 * para cómo conectar uno). Desde Fase 12 hace además una lectura mínima a
 * la base de datos (`company`, tabla que siempre debe tener exactamente
 * una fila) para distinguir "el proceso responde" de "el proceso responde
 * pero no puede hablar con Supabase" — sin esto, un uptime monitor vería
 * 200 OK incluso con la base de datos completamente caída.
 */
export async function GET() {
  let database: "ok" | "error" = "error";

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("company").select("id").limit(1);
    database = error ? "error" : "ok";
  } catch {
    // Sin credenciales de Supabase configuradas (ej. este sandbox) o
    // cualquier otro fallo de red/config, se reporta como caído en vez
    // de lanzar — este endpoint nunca debe devolver un 500 sin cuerpo.
    database = "error";
  }

  return NextResponse.json(
    {
      ok: database === "ok",
      service: "zoe-catalog",
      checks: { database },
      timestamp: new Date().toISOString(),
    },
    { status: database === "ok" ? 200 : 503 },
  );
}
