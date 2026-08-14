"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

const noteSchema = z.string().trim().min(1, "La nota no puede estar vacía").max(1000);
const uuidSchema = z.string().uuid();

export interface FormState {
  error: string | null;
}

export async function addCustomerNote(
  customerId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdminUser(["super_admin", "admin", "sales"]);
  const parsedNote = noteSchema.safeParse(formData.get("note"));
  if (!parsedNote.success)
    return { error: parsedNote.error.issues[0]?.message ?? "Nota inválida" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_notes")
    .insert({ customer_id: customerId, user_id: admin.id, note: parsedNote.data });
  if (error) return { error: error.message };

  revalidatePath(`/admin/clientes/${customerId}`);
  return { error: null };
}

export async function assignTag(customerId: string, tagId: string): Promise<void> {
  const admin = await requireAdminUser(["super_admin", "admin", "sales"]);
  uuidSchema.parse(customerId);
  uuidSchema.parse(tagId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_tag_assignments")
    .insert({ customer_id: customerId, tag_id: tagId, assigned_by: admin.id });
  if (error && !error.message.includes("duplicate")) throw error;

  revalidatePath(`/admin/clientes/${customerId}`);
}

export async function removeTag(customerId: string, tagId: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin", "sales"]);
  uuidSchema.parse(customerId);
  uuidSchema.parse(tagId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_tag_assignments")
    .delete()
    .eq("customer_id", customerId)
    .eq("tag_id", tagId);
  if (error) throw error;

  revalidatePath(`/admin/clientes/${customerId}`);
}
