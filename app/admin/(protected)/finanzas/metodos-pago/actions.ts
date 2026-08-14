"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

const paymentMethodSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  instructions: z.string().trim().max(2000).optional(),
});

export async function createPaymentMethod(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = paymentMethodSchema.safeParse({
    name: formData.get("name"),
    instructions: formData.get("instructions") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_methods").insert({
    name: parsed.data.name,
    instructions: parsed.data.instructions ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas/metodos-pago");
  return { error: null };
}

export async function togglePaymentMethodActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/finanzas/metodos-pago");
  revalidatePath("/checkout");
}

export async function updatePaymentMethod(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = paymentMethodSchema.safeParse({
    name: formData.get("name"),
    instructions: formData.get("instructions") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ name: parsed.data.name, instructions: parsed.data.instructions ?? null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas/metodos-pago");
  return { error: null };
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/finanzas/metodos-pago");
  revalidatePath("/checkout");
}
