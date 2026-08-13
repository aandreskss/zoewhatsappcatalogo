"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

const hoursSchema = z.object({
  storeId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  closed: z.coerce.boolean(),
  opensAt: z.string().trim().optional(),
  closesAt: z.string().trim().optional(),
});

/**
 * Horario por sucursal (sección 22 del plan — NAP/`LocalBusiness`
 * consistente para SEO local). Un día `closed` no requiere horas; uno
 * abierto sí, y se valida que abra antes de cerrar.
 */
export async function saveStoreDayHours(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = hoursSchema.safeParse({
    storeId: formData.get("storeId"),
    dayOfWeek: formData.get("dayOfWeek"),
    closed: formData.get("closed") === "on",
    opensAt: formData.get("opensAt") || undefined,
    closesAt: formData.get("closesAt") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { storeId, dayOfWeek, closed, opensAt, closesAt } = parsed.data;

  if (!closed) {
    if (!opensAt || !closesAt) {
      return { error: "Indica hora de apertura y cierre, o marca el día como cerrado." };
    }
    if (opensAt >= closesAt) {
      return { error: "La hora de apertura debe ser anterior a la de cierre." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("store_hours").upsert(
    {
      store_id: storeId,
      day_of_week: dayOfWeek,
      closed,
      opens_at: closed ? null : opensAt,
      closes_at: closed ? null : closesAt,
    },
    { onConflict: "store_id,day_of_week" },
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/entrega/horarios");
  revalidatePath("/tiendas");
  return { error: null };
}
