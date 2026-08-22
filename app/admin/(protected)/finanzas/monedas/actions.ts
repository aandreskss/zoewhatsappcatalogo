"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { refreshAutomaticExchangeRates } from "@/lib/domain/exchange-rate-provider";

export interface FormState {
  error: string | null;
}

const manualRateSchema = z.object({
  pair: z.enum(["USD/VES", "EUR/VES"]),
  rate: z.coerce.number().positive("La tasa debe ser mayor que cero"),
});

/**
 * Carga manual de tasa (sección 15 del plan): siempre disponible como
 * respaldo garantizado, sin importar si el proveedor automático
 * funciona. Cada carga es una fila nueva en `exchange_rates` (histórico
 * append-only) — nunca se actualiza una fila existente, porque los
 * pedidos ya creados referencian la tasa que estaba vigente en su
 * momento (snapshot, nunca se recalculan pedidos históricos).
 */
export async function setManualExchangeRate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = manualRateSchema.safeParse({
    pair: formData.get("pair"),
    rate: formData.get("rate"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("exchange_rates").insert({
    currency_pair: parsed.data.pair,
    rate: parsed.data.rate,
    source: "manual",
    is_automatic: false,
    fetched_at: now,
    effective_at: now,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas/monedas");
  revalidatePath("/catalogo");
  return { error: null };
}

const referenceSchema = z.enum(["USD", "EUR"]);

export async function setVesReferenceCurrency(currency: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = referenceSchema.parse(currency);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("company_settings").upsert({
    key: "ves_reference_currency",
    value: parsed,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  revalidatePath("/admin/finanzas/monedas");
  revalidatePath("/catalogo");
}

/**
 * Botón "Actualizar ahora" del panel admin — reusa el mismo adaptador que
 * el cron job, pero disparado manualmente por un admin autenticado (no
 * requiere `CRON_SECRET`, la autorización ya la dio `requireAdminUser`).
 */
export async function refreshRatesNow(): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const results = await refreshAutomaticExchangeRates(supabase);
  const failed = results.filter((r) => !r.ok);

  revalidatePath("/admin/finanzas/monedas");
  revalidatePath("/catalogo");

  if (failed.length === results.length) {
    return {
      error: "Ningún proveedor automático respondió. Puedes cargar la tasa manualmente.",
    };
  }
  return { error: null };
}
