"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

export async function updateInventoryAction(
  variantId: string,
  storeId: string,
  quantity: number,
): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin", "inventory"]);

  const parsed = z
    .object({
      variantId: z.string().uuid(),
      storeId: z.string().uuid(),
      quantity: z.number().int().min(0),
    })
    .safeParse({ variantId, storeId, quantity });
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = createSupabaseServiceRoleClient();

  const { data: current } = await supabase
    .from("inventory")
    .select("quantity_on_hand")
    .eq("variant_id", variantId)
    .eq("store_id", storeId)
    .maybeSingle();

  const prev = current?.quantity_on_hand ?? 0;
  const delta = quantity - prev;

  const { error: upsertError } = await supabase.from("inventory").upsert(
    { variant_id: variantId, store_id: storeId, quantity_on_hand: quantity },
    { onConflict: "variant_id,store_id" },
  );
  if (upsertError) return { error: upsertError.message };

  await supabase.from("inventory_movements").insert({
    variant_id: variantId,
    store_id: storeId,
    type: "ajuste",
    quantity_delta: delta,
    previous_quantity: prev,
    new_quantity: quantity,
  });

  revalidatePath("/admin/inventario");
  return { error: null };
}

export async function updateCostAction(
  variantId: string,
  costUsd: number | null,
): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin", "inventory"]);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ cost_usd: costUsd })
    .eq("id", variantId);
  if (error) return { error: error.message };

  const { data: variant } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .maybeSingle();

  revalidatePath("/admin/inventario");
  if (variant?.product_id) revalidatePath(`/admin/productos/${variant.product_id}`);
  return { error: null };
}

export async function updateVariantPriceAction(
  variantId: string,
  priceUsd: number,
): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin", "inventory"]);
  if (priceUsd < 0) return { error: "El precio debe ser ≥ 0" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ price_usd: priceUsd })
    .eq("id", variantId);
  if (error) return { error: error.message };

  const { data: variant } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .maybeSingle();

  revalidatePath("/admin/inventario");
  if (variant?.product_id) revalidatePath(`/admin/productos/${variant.product_id}`);
  return { error: null };
}

export async function deleteProductFromInventoryAction(
  productId: string,
): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = z.string().uuid().safeParse(productId);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return { error: null };
}

export async function deleteVariantAction(
  variantId: string,
): Promise<{ error: string | null }> {
  await requireAdminUser(["super_admin", "admin", "inventory"]);

  const parsed = z.string().uuid().safeParse(variantId);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ status: "inactive" })
    .eq("id", variantId);
  if (error) return { error: error.message };

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return { error: null };
}

export async function getMovementsAction(variantId: string): Promise<{
  data: {
    id: string;
    type: string;
    quantity_delta: number;
    previous_quantity: number;
    new_quantity: number;
    reason: string | null;
    created_at: string;
    stores: { name: string } | null;
  }[] | null;
  error: string | null;
}> {
  await requireAdminUser(["super_admin", "admin", "inventory"]);

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("id, type, quantity_delta, previous_quantity, new_quantity, reason, created_at, stores(name)")
    .eq("variant_id", variantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((m) => ({
      ...m,
      stores: Array.isArray(m.stores) ? (m.stores[0] ?? null) : m.stores,
    })),
    error: null,
  };
}
