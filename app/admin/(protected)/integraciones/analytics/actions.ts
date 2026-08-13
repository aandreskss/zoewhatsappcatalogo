"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import type { Json } from "@/lib/db/supabase/types";

export interface FormState {
  error: string | null;
}

/**
 * Un provider por formulario (sección 21/26 del plan): cada uno tiene un
 * único campo de ID relevante en `public_config` (measurementId,
 * containerId o pixelId — ver `ThirdPartyScripts`), así que en vez de un
 * editor de JSON libre (como en `home_sections`, donde el config sí varía
 * mucho por tipo) se usa un campo de texto simple por integración. `active`
 * viaja en el mismo submit: guardar sin ID activo no tiene efecto porque
 * `ThirdPartyScripts` no renderiza nada sin el campo esperado.
 */
const PROVIDER_CONFIG_KEY = {
  ga4: "measurementId",
  gtm: "containerId",
  meta_pixel: "pixelId",
  tiktok: "pixelId",
} as const;

const integrationSchema = z.object({
  provider: z.enum(["ga4", "gtm", "meta_pixel", "tiktok"]),
  configValue: z.string().trim().max(200).optional(),
  active: z.coerce.boolean(),
});

export async function saveIntegration(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = integrationSchema.safeParse({
    provider: formData.get("provider"),
    configValue: formData.get("configValue") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { provider, configValue, active } = parsed.data;
  const configKey = PROVIDER_CONFIG_KEY[provider];
  const publicConfig = configValue ? { [configKey]: configValue } : {};

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("integrations").upsert(
    {
      provider,
      public_config: publicConfig as Json,
      active: active && Boolean(configValue),
    },
    { onConflict: "provider" },
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/integraciones/analytics");
  revalidatePath("/", "layout");
  return { error: null };
}
