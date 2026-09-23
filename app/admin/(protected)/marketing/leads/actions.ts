"use server";

import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function deleteLeadAction(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin", "sales"]);
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("vip_leads").delete().eq("id", id);
  revalidatePath("/admin/marketing/leads");
}
