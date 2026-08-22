"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { generateUniqueSlug } from "@/lib/domain/admin-catalog";

export interface FormState {
  error: string | null;
}

const nameSchema = z.string().trim().min(1, "El nombre es obligatorio").max(120);

export async function createBrand(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();
  const slug = await generateUniqueSlug(supabase, "brands", parsed.data);

  const { error } = await supabase.from("brands").insert({ name: parsed.data, slug });
  if (error) return { error: error.message };

  revalidatePath("/admin/marcas");
  return { error: null };
}

export async function toggleBrandActive(id: string, active: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("brands").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/marcas");
  revalidatePath("/catalogo");
}

export async function deleteBrand(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message.includes("foreign key") ? "Esta marca tiene productos asociados. Reasígnalos primero." : error.message);
  revalidatePath("/admin/marcas");
}
