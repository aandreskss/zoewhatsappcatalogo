"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

/**
 * Retiro en tienda / delivery se configuran por sucursal
 * (`stores.pickup_enabled`/`delivery_enabled`, sección 5 del plan) — el
 * CRUD completo de sucursales queda fuera del alcance de esta fase
 * (Monedas y comercial), pero estos dos flags sí son "configuración de
 * entrega administrable" y viven aquí.
 */
export async function toggleStorePickup(id: string, enabled: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("stores")
    .update({ pickup_enabled: enabled })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/pickup");
  revalidatePath("/checkout");
}

export async function toggleStoreDelivery(id: string, enabled: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("stores")
    .update({ delivery_enabled: enabled })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/pickup");
  revalidatePath("/checkout");
}
