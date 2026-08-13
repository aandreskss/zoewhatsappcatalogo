import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { refreshAutomaticExchangeRates } from "@/lib/domain/exchange-rate-provider";

/**
 * Refresca la tasa BCV automática (USD/VES y EUR/VES) — sección 15 del
 * plan. Igual que `release-reservations`: GET porque Vercel Cron solo
 * invoca así, protegido con `CRON_SECRET` para que nadie más lo dispare
 * por HTTP. El BCV publica normalmente una vez por día hábil; se corre
 * cada 2 horas (ver `vercel.json`) para no perder actualizaciones sin
 * golpear el proveedor de forma excesiva.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const results = await refreshAutomaticExchangeRates(supabase);

  return NextResponse.json({ results });
}
