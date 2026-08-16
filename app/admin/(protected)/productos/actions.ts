"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { productSchema, variantSchema } from "@/lib/validation/catalog";
import {
  generateUniqueSlug,
  createVariantWithOptions,
  recordSlugChangeIfNeeded,
  revalidateProductPublicPaths,
} from "@/lib/domain/admin-catalog";

export interface FormState {
  error: string | null;
  productId?: string;
  productName?: string;
}

export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = productSchema.omit({ slug: true }).safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || null,
    brandId: formData.get("brandId") || null,
    categoryId: formData.get("categoryId") || null,
    gender: formData.get("gender") || null,
    descriptionShort: formData.get("descriptionShort") || null,
    description: formData.get("description") || null,
    material: formData.get("material") || null,
    tags: [],
    status: "draft",
    isNew: formData.get("isNew") === "on",
    isFeatured: false,
    isBestseller: false,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueSlug(supabase, "products", parsed.data.name);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug,
      sku: parsed.data.sku,
      brand_id: parsed.data.brandId,
      category_id: parsed.data.categoryId,
      gender: parsed.data.gender,
      description_short: parsed.data.descriptionShort,
      description: parsed.data.description,
      material: parsed.data.material,
      status: "draft",
      is_new: parsed.data.isNew,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "No se pudo crear el producto: " + error.message };
  }

  revalidatePath("/admin/productos");
  return { error: null, productId: product.id, productName: parsed.data.name };
}

const statusSchema = z.enum(["draft", "published", "hidden", "archived"]);

export async function updateProductStatus(
  productId: string,
  status: string,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const parsedStatus = statusSchema.parse(status);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({ status: parsedStatus })
    .eq("id", productId);
  if (error) throw error;

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
}

export async function updateProductName(
  productId: string,
  name: string,
): Promise<FormState> {
  const admin = await requireAdminUser(["super_admin", "admin"]);
  const trimmed = name.trim();
  if (trimmed.length === 0) return { error: "El nombre no puede quedar vacío" };

  const supabase = await createSupabaseServerClient();

  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  if (currentError) return { error: currentError.message };

  const newSlug = await generateUniqueSlug(supabase, "products", trimmed);

  const { error } = await supabase
    .from("products")
    .update({ name: trimmed, slug: newSlug })
    .eq("id", productId);
  if (error) return { error: error.message };

  await recordSlugChangeIfNeeded(supabase, "product", productId, current.slug, newSlug);
  void admin; // reservado para audit log detallado en una fase posterior

  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
  return { error: null };
}

export async function addVariantAction(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const parsed = variantSchema.safeParse({
    sku: formData.get("sku"),
    color: formData.get("color"),
    colorHex: formData.get("colorHex") || null,
    size: formData.get("size"),
    priceUsd: formData.get("priceUsd"),
    compareAtPriceUsd: formData.get("compareAtPriceUsd") || null,
    status: "active",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();

  try {
    await createVariantWithOptions(supabase, {
      productId,
      sku: parsed.data.sku,
      priceUsd: parsed.data.priceUsd,
      compareAtPriceUsd: parsed.data.compareAtPriceUsd ?? null,
      color: parsed.data.color,
      colorHex: parsed.data.colorHex ?? null,
      size: parsed.data.size,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo crear la variante" };
  }

  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
  return { error: null };
}

export async function addImageAction(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminUser(["super_admin", "admin"]);

  const url = z.string().url("URL de imagen inválida").safeParse(formData.get("url"));
  if (!url.success) return { error: url.error.issues[0]?.message ?? "URL inválida" };

  const altText = String(formData.get("altText") ?? "").trim();

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    url: url.data,
    alt_text: altText,
    order: count ?? 0,
    is_primary: (count ?? 0) === 0,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
  return { error: null };
}

export async function deleteImageAction(
  imageId: string,
  productId: string,
): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();

  // Si era la imagen principal, promover la siguiente
  const { data: img } = await supabase
    .from("product_images")
    .select("is_primary")
    .eq("id", imageId)
    .maybeSingle();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;

  if (img?.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("order")
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }

  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
}

export async function deleteProduct(productId: string): Promise<void> {
  await requireAdminUser(["super_admin", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw error;
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function setInventoryAction(
  variantId: string,
  storeId: string,
  quantity: number,
  productId: string,
): Promise<void> {
  const admin = await requireAdminUser(["super_admin", "admin", "inventory"]);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("La cantidad debe ser un entero >= 0");
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("inventory")
    .select("id, quantity_on_hand")
    .eq("variant_id", variantId)
    .eq("store_id", storeId)
    .maybeSingle();

  const previousQuantity = existing?.quantity_on_hand ?? 0;

  if (existing) {
    const { error } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: quantity })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("inventory")
      .insert({ variant_id: variantId, store_id: storeId, quantity_on_hand: quantity });
    if (error) throw error;
  }

  // Todo ajuste manual de stock queda como movimiento auditable (regla
  // permanente 30) — no solo se sobrescribe el número.
  const { error: movementError } = await supabase.from("inventory_movements").insert({
    variant_id: variantId,
    store_id: storeId,
    type: "ajuste",
    quantity_delta: quantity - previousQuantity,
    reason: "Ajuste manual desde /admin/productos",
    user_id: admin.id,
    previous_quantity: previousQuantity,
    new_quantity: quantity,
  });
  if (movementError) throw movementError;

  revalidatePath(`/admin/productos/${productId}`);
  await revalidateProductPublicPaths(supabase, productId);
}
