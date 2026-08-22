"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

const zoneSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  city: z.string().trim().max(120).optional(),
  costUsd: z.coerce.number().min(0, "El costo no puede ser negativo"),
});

export async function createShippingZone(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city") || undefined,
    costUsd: formData.get("costUsd"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("shipping_zones").insert({
    name: parsed.data.name,
    city: parsed.data.city ?? null,
    cost_usd: parsed.data.costUsd,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/entrega/delivery");
  return { error: null };
}

export async function toggleShippingZoneActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("shipping_zones").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/delivery");
  revalidatePath("/checkout");
}

export async function deleteShippingZone(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/delivery");
  revalidatePath("/checkout");
}
