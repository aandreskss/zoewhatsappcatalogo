import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import type { VariantAvailability } from "@/lib/domain/inventory-shared";

type DB = SupabaseClient<Database>;

export type {
  VariantAvailability,
  StockVisibilityMode,
} from "@/lib/domain/inventory-shared";
export { describeAvailability } from "@/lib/domain/inventory-shared";

/**
 * Disponibilidad real (`on_hand - reservas activas`), nunca la tabla
 * `inventory` cruda — ver sección 14 del plan. Lee la vista
 * `variant_availability` creada en 0012_row_level_security.sql.
 */
export async function getAvailabilityForVariants(
  supabase: DB,
  variantIds: string[],
): Promise<VariantAvailability[]> {
  if (variantIds.length === 0) return [];

  const { data, error } = await supabase
    .from("variant_availability")
    .select("variant_id, store_id, available")
    .in("variant_id", variantIds);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    variantId: row.variant_id,
    storeId: row.store_id,
    available: row.available,
  }));
}
