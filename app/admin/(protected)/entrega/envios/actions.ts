"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

const carrierSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  notes: z.string().trim().max(500).optional(),
});

export async function createShippingCarrier(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = carrierSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shipping_carriers")
    .insert({ name: parsed.data.name, notes: parsed.data.notes ?? null });
  if (error) return { error: error.message };

  revalidatePath("/admin/entrega/envios");
  return { error: null };
}

export async function toggleShippingCarrierActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shipping_carriers")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/envios");
}
