import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import { listPublishedProducts, type ProductListItem } from "@/lib/domain/catalog";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

type DB = SupabaseClient<Database>;

const MIN_QUERY_LENGTH = 2;

/**
 * Búsqueda tolerante a errores tipográficos (sección 8/22/46 del plan)
 * vía la función SQL `search_products` (0017, pg_trgm). Devuelve los
 * productos completos (reutilizando `listPublishedProducts`), respetando
 * el orden de relevancia que ya calculó Postgres.
 */
export async function searchProducts(
  supabase: DB,
  query: string,
  limit = 24,
): Promise<{ products: ProductListItem[]; resultsCount: number }> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return { products: [], resultsCount: 0 };

  const { data, error } = await supabase.rpc("search_products", {
    p_query: trimmed,
    p_limit: limit,
  });
  if (error) throw error;

  const productIds = (data ?? []).map((row) => row.product_id);
  if (productIds.length === 0) return { products: [], resultsCount: 0 };

  const products = await listPublishedProducts(supabase, {
    productIds,
    limit: productIds.length,
  });
  return { products, resultsCount: products.length };
}

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export async function suggestProducts(
  supabase: DB,
  query: string,
  limit = 6,
): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const { data, error } = await supabase.rpc("suggest_products", {
    p_query: trimmed,
    p_limit: limit,
  });
  if (error) throw error;

  const productIds = (data ?? []).map((row) => row.product_id);
  if (productIds.length === 0) return [];

  const products = await listPublishedProducts(supabase, {
    productIds,
    limit: productIds.length,
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.primaryImageUrl,
  }));
}

/**
 * Registra la búsqueda (sección 21 del plan: incluye las que no
 * devuelven resultados — clave para saber qué busca la clienta y no
 * tiene). Se hace con la Service Role Key igual que el resto de
 * escrituras públicas (`search_logs` no tiene policy de insert anon —
 * ver comentario en 0012_row_level_security.sql), y nunca bloquea la
 * respuesta de búsqueda si falla (no es crítico para el usuario).
 */
export async function logSearch(
  query: string,
  resultsCount: number,
  sessionId: string | null,
): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("search_logs").insert({
      query: query.trim(),
      results_count: resultsCount,
      session_id: sessionId,
    });
  } catch {
    // Nunca romper la búsqueda del cliente por un fallo al loguear.
  }
}
