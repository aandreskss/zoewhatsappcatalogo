"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export interface FormState {
  error: string | null;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const storeSchema = z.object({
  name:            z.string().trim().min(1, "El nombre es obligatorio").max(120),
  code:            z.string().trim().min(1, "El código es obligatorio").max(10).toUpperCase(),
  address:         z.string().trim().max(255).optional(),
  city:            z.string().trim().max(100).optional(),
  state:           z.string().trim().max(100).optional(),
  phone:           z.string().trim().max(30).optional(),
  whatsapp:        z.string().trim().max(30).optional(),
  google_maps_url: z.string().trim().url("URL de Google Maps inválida").optional().or(z.literal("")),
  lat:             z.coerce.number().optional().nullable(),
  lng:             z.coerce.number().optional().nullable(),
});

function parseFormData(formData: FormData) {
  return storeSchema.safeParse({
    name:            formData.get("name"),
    code:            formData.get("code"),
    address:         formData.get("address") || undefined,
    city:            formData.get("city") || undefined,
    state:           formData.get("state") || undefined,
    phone:           formData.get("phone") || undefined,
    whatsapp:        formData.get("whatsapp") || undefined,
    google_maps_url: formData.get("google_maps_url") || undefined,
    lat:             formData.get("lat") || undefined,
    lng:             formData.get("lng") || undefined,
  });
}

export async function createStore(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = parseFormData(formData);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { name, code, google_maps_url, lat, lng, ...rest } = parsed.data;
  const slug = slugify(name);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stores").insert({
    name,
    code,
    slug,
    google_maps_url: google_maps_url || null,
    lat: lat ?? null,
    lng: lng ?? null,
    ...rest,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
  revalidatePath("/admin/entrega/horarios");
  return { error: null };
}

export async function updateStore(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsed = parseFormData(formData);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { name, google_maps_url, lat, lng, ...rest } = parsed.data;
  const slug = slugify(name);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("stores")
    .update({ name, slug, google_maps_url: google_maps_url || null, lat: lat ?? null, lng: lng ?? null, ...rest })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
  return { error: null };
}

export async function toggleStoreActive(id: string, active: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stores").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
}

export async function toggleStorePickup(id: string, pickup_enabled: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stores").update({ pickup_enabled }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
}

export async function toggleStoreDelivery(id: string, delivery_enabled: boolean): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stores").update({ delivery_enabled }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
}

export async function deleteStore(id: string): Promise<void> {
  await requireAdminUser(["super_admin"]);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/entrega/sucursales");
  revalidatePath("/admin/entrega/pickup");
  revalidatePath("/admin/entrega/horarios");
}
