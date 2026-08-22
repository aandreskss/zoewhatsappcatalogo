"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

const bannerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  imageDesktopUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  imageMobileUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  headline: z.string().trim().max(200).optional(),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaUrl: z.string().trim().max(300).optional(),
  position: z.string().trim().min(1).max(60),
  priority: z.coerce.number().int().default(0),
});

export async function createBanner(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = bannerSchema.safeParse({
    name: formData.get("name"),
    imageDesktopUrl: formData.get("imageDesktopUrl") || undefined,
    imageMobileUrl: formData.get("imageMobileUrl") || undefined,
    headline: formData.get("headline") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaUrl: formData.get("ctaUrl") || undefined,
    position: formData.get("position") || "home",
    priority: formData.get("priority") || 0,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("banners").insert({
    name: parsed.data.name,
    image_desktop_url: parsed.data.imageDesktopUrl || null,
    image_mobile_url: parsed.data.imageMobileUrl || null,
    headline: parsed.data.headline ?? null,
    cta_label: parsed.data.ctaLabel ?? null,
    cta_url: parsed.data.ctaUrl ?? null,
    position: parsed.data.position,
    priority: parsed.data.priority,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/marketing/banners");
  revalidatePath("/");
  return { error: null };
}

export async function toggleBannerActive(id: string, active: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("banners").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/marketing/banners");
  revalidatePath("/");
}
