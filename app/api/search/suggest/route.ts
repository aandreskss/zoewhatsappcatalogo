import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { suggestProducts } from "@/lib/domain/search";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Sugerencias de autocomplete (sección 46 del plan) — se llama con cada
 * tecla (debounced en `SearchBox`), así que usa la clave anon (respeta
 * RLS de catálogo publicado) y no registra en `search_logs` (solo la
 * búsqueda final en `/buscar` se registra, para no inflar el log con
 * cada tecla presionada). Rate limit generoso (sección 23 del plan) — 60
 * por minuto por IP alcanza para un uso normal (incluso tecleando rápido
 * con el debounce de 250ms de `SearchBox`) sin abrir la puerta a scraping.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`search-suggest:${ip}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const supabase = await createSupabaseServerClient();
  const suggestions = await suggestProducts(supabase, q);

  return NextResponse.json({ suggestions });
}
