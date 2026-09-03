"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import type { Json } from "@/lib/db/supabase/types";

export interface FormState {
  error: string | null;
}

const HOME_SECTION_TYPES = [
  "hero",
  "banner",
  "categories",
  "product_slider",
  "collection",
  "image_text",
  "cta",
  "brands",
  "features",
  "testimonials",
  "instagram",
  "stores",
] as const;

const jsonConfigSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return {};
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("not an object");
      }
      return parsed as Record<string, unknown>;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "El config debe ser un objeto JSON válido, ej. {}",
      });
      return z.NEVER;
    }
  });

const sectionSchema = z.object({
  type: z.enum(HOME_SECTION_TYPES),
  title: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(300).optional(),
  config: jsonConfigSchema,
});

export async function createHomeSection(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = sectionSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title") || undefined,
    subtitle: formData.get("subtitle") || undefined,
    config: formData.get("config") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();

  const { data: maxOrderRow } = await supabase
    .from("home_sections")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxOrderRow?.order ?? -1) + 1;

  const { error } = await supabase.from("home_sections").insert({
    type: parsed.data.type,
    title: parsed.data.title ?? null,
    subtitle: parsed.data.subtitle ?? null,
    config: parsed.data.config as Json,
    order: nextOrder,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/marketing/home");
  revalidatePath("/");
  return { error: null };
}

export async function toggleHomeSectionActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("home_sections").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/marketing/home");
  revalidatePath("/");
}

export async function deleteHomeSection(id: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("home_sections").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/marketing/home");
  revalidatePath("/");
}

/**
 * Mueve un bloque un lugar arriba/abajo intercambiando `order` con su
 * vecino — suficiente para reordenar sin arrastrar-y-soltar (fuera de
 * alcance de esta fase, ver comentario en `lib/domain/home.ts`).
 */
export async function updateHomeSectionConfig(
  id: string,
  rawConfig: string,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = jsonConfigSchema.safeParse(rawConfig);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "JSON inválido");
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("home_sections")
    .update({ config: parsed.data as Json })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/marketing/home");
  revalidatePath("/");
}

export async function moveHomeSection(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();

  const { data: sections, error } = await supabase
    .from("home_sections")
    .select("id, order")
    .order("order");
  if (error) throw error;

  const list = sections ?? [];
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index]!;
  const swapWith = list[swapIndex]!;

  await supabase
    .from("home_sections")
    .update({ order: swapWith.order })
    .eq("id", current.id);
  await supabase
    .from("home_sections")
    .update({ order: current.order })
    .eq("id", swapWith.id);

  revalidatePath("/admin/marketing/home");
  revalidatePath("/");
}
