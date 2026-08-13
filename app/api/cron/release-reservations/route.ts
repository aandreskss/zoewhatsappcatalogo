import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

/**
 * Libera reservas de stock vencidas (sección 14/51 del plan). Vercel Cron
 * invoca rutas de cron con GET y agrega automáticamente
 * `Authorization: Bearer $CRON_SECRET` cuando esa variable de entorno
 * existe — por eso el handler es GET, no POST. `CRON_SECRET` evita que
 * cualquiera pueda llamarlo por HTTP. No requiere un worker separado: es
 * solo una función de base de datos idempotente
 * (`release_expired_reservations()`, ver 0013_order_domain_functions.sql).
 */
export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: releasedCount, error } = await supabase.rpc(
    "release_expired_reservations",
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ released: releasedCount ?? 0 });
}
