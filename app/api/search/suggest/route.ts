import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { suggestProducts } from "@/lib/domain/search";

/**
 * Sugerencias de autocomplete (sección 46 del plan) — se llama con cada
 * tecla (debounced en `SearchBox`), así que usa la clave anon (respeta
 * RLS de catálogo publicado) y no registra en `search_logs` (solo la
 * búsqueda final en `/buscar` se registra, para no inflar el log con
 * cada tecla presionada).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const supabase = await createSupabaseServerClient();
  const suggestions = await suggestProducts(supabase, q);

  return NextResponse.json({ suggestions });
}
