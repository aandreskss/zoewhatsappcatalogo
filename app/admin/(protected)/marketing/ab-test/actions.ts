"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { saveABTestConfig } from "@/lib/domain/ab-test";

export interface ABTestFormState {
  error: string | null;
  success?: boolean;
}

const schema = z.object({
  enabled: z.boolean(),
  lpUrl: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .max(200)
    .regex(/^\//, "La URL debe comenzar con /"),
  percentage: z.number().int().min(1).max(99),
});

export async function saveABTest(
  _prev: ABTestFormState,
  formData: FormData,
): Promise<ABTestFormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = schema.safeParse({
    enabled: formData.get("enabled") === "true",
    lpUrl: formData.get("lpUrl"),
    percentage: Number(formData.get("percentage")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createSupabaseServiceRoleClient();
  try {
    await saveABTestConfig(supabase, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al guardar" };
  }

  revalidatePath("/admin/marketing/ab-test");
  revalidatePath("/");
  return { error: null, success: true };
}
