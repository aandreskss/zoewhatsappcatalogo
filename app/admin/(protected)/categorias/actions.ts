"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { generateUniqueSlug } from "@/lib/domain/admin-catalog";

export interface FormState {
  error: string | null;
}

const nameSchema = z.string().trim().min(1, "El nombre es obligatorio").max(120);

export async function createCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueSlug(supabase, "categories", parsed.data);

  const { error } = await supabase.from("categories").insert({ name: parsed.data, slug });
  if (error) return { error: error.message };

  revalidatePath("/admin/categorias");
  return { error: null };
}

export async function toggleCategoryActive(id: string, active: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message.includes("foreign key") ? "Esta categoría tiene productos asociados. Reasígnalos primero." : error.message);
  revalidatePath("/admin/categorias");
}
