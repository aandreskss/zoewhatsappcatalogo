"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { themeTokensToJson } from "@/lib/domain/theme";

export interface FormState {
  error: string | null;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const themeSchema = z.object({
  colorPrimary: z.string().regex(HEX_COLOR_RE, "Color primario inválido"),
  colorSecondary: z.string().regex(HEX_COLOR_RE, "Color secundario inválido"),
  colorAccent: z.string().regex(HEX_COLOR_RE, "Color de acento inválido"),
  colorBackground: z.string().regex(HEX_COLOR_RE, "Color de fondo inválido"),
  colorForeground: z.string().regex(HEX_COLOR_RE, "Color de texto inválido"),
  radius: z.enum(["sm", "md", "lg"]),
});

/**
 * Guarda el theme de marca (sección 28 del plan) — solo Super Admin, es
 * configuración de "Apariencia" a nivel de todo el sitio, no de un módulo
 * operativo. Un solo theme "activo" a la vez: se desactivan los demás
 * antes de activar este (la tabla soporta varios por diseño, pero el V1
 * del admin solo expone editar el actual, no un historial de versiones).
 */
export async function saveTheme(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin"]);

  const parsed = themeSchema.safeParse({
    colorPrimary: formData.get("colorPrimary"),
    colorSecondary: formData.get("colorSecondary"),
    colorAccent: formData.get("colorAccent"),
    colorBackground: formData.get("colorBackground"),
    colorForeground: formData.get("colorForeground"),
    radius: formData.get("radius"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: existing } = await supabase
    .from("themes")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const tokens = themeTokensToJson(parsed.data);

  if (existing) {
    const { error } = await supabase
      .from("themes")
      .update({ tokens })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    // Nunca hubo un theme guardado: desactivar cualquier fila suelta (no
    // debería existir ninguna con `is_active=true`, pero por si acaso) y
    // crear la primera.
    await supabase.from("themes").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("themes").insert({
      name: "Zoe Shoes",
      tokens,
      is_active: true,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/apariencia/branding");
  return { error: null };
}
