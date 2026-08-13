import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";

type DB = SupabaseClient<Database>;

/**
 * Todas las mutaciones de carrito pasan por aquí usando la Service Role
 * Key (nunca la clave anon: RLS no da escritura pública sobre `carts`/
 * `cart_items` — ver el comentario al inicio de
 * `supabase/migrations/0012_row_level_security.sql`). La "propiedad" del
 * carrito la determina el `session_id` de una cookie httpOnly que el
 * propio servidor generó — nunca un valor que mande el cliente en el
 * body de la petición.
 */

export class CartError extends Error {
  constructor(
    message: string,
    public code: "VARIANT_NOT_AVAILABLE" | "ITEM_NOT_FOUND" | "INVALID_QUANTITY",
  ) {
    super(message);
  }
}

export async function getOrCreateActiveCart(supabase: DB, sessionId: string) {
  const { data: existing, error: findError } = await supabase
    .from("carts")
    .select("id, session_id, status")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("carts")
    .insert({ session_id: sessionId })
    .select("id, session_id, status")
    .single();

  if (createError) throw createError;
  return created;
}

export interface CartItemView {
  id: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  variantLabel: string;
  currentPriceUsd: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export async function getCartWithItems(
  supabase: DB,
  sessionId: string,
): Promise<{ cartId: string; items: CartItemView[] }> {
  const cart = await getOrCreateActiveCart(supabase, sessionId);

  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, variant_id, quantity")
    .eq("cart_id", cart.id);
  if (error) throw error;
  if (!items || items.length === 0) return { cartId: cart.id, items: [] };

  const variantIds = items.map((item) => item.variant_id);

  // Consultas simples y explícitas en vez de un embed de 3 niveles: más
  // fácil de razonar y de mantener correctamente tipado que una relación
  // anidada (cart_items → variants → products/opciones/imágenes) en una
  // sola llamada a PostgREST.
  const [
    { data: variants, error: variantsError },
    { data: optionLinks },
    { data: imageLinks },
  ] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, price_usd, status, product_id")
      .in("id", variantIds),
    supabase
      .from("variant_option_values")
      .select("variant_id, option_value_id, product_option_values(value)")
      .in("variant_id", variantIds),
    supabase
      .from("variant_images")
      .select("variant_id, product_images(url, order)")
      .in("variant_id", variantIds),
  ]);
  if (variantsError) throw variantsError;

  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, slug, status, deleted_at")
    .in("id", productIds);
  if (productsError) throw productsError;

  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  const variantsById = new Map((variants ?? []).map((v) => [v.id, v]));

  const labelsByVariant = new Map<string, string[]>();
  for (const link of optionLinks ?? []) {
    const value = link.product_option_values?.value;
    if (!value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(value);
    labelsByVariant.set(link.variant_id, list);
  }

  const imageByVariant = new Map<string, string>();
  for (const link of imageLinks ?? []) {
    if (imageByVariant.has(link.variant_id)) continue;
    const url = link.product_images?.url;
    if (url) imageByVariant.set(link.variant_id, url);
  }

  const view: CartItemView[] = items.flatMap((item) => {
    const variant = variantsById.get(item.variant_id);
    const product = variant ? productsById.get(variant.product_id) : undefined;
    if (!variant || !product) return []; // variante/producto borrado: se omite, nunca truena el carrito

    return [
      {
        id: item.id,
        variantId: item.variant_id,
        quantity: item.quantity,
        productName: product.name,
        productSlug: product.slug,
        variantLabel: (labelsByVariant.get(item.variant_id) ?? []).join(" / ") || "—",
        currentPriceUsd: variant.price_usd,
        imageUrl: imageByVariant.get(item.variant_id) ?? null,
        isAvailable:
          variant.status === "active" &&
          product.status === "published" &&
          !product.deleted_at,
      },
    ];
  });

  return { cartId: cart.id, items: view };
}

export async function addItemToCart(
  supabase: DB,
  sessionId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new CartError("La cantidad debe ser un entero positivo", "INVALID_QUANTITY");
  }

  // Nunca confiar en un precio que venga del cliente: se lee el precio
  // actual del catálogo. El total real de todos modos se vuelve a
  // recalcular por completo en el checkout (sección 16 del plan).
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, price_usd, status, products!inner(status, deleted_at)")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError) throw variantError;
  if (
    !variant ||
    variant.status !== "active" ||
    variant.products.status !== "published" ||
    variant.products.deleted_at
  ) {
    throw new CartError("Esta variante ya no está disponible", "VARIANT_NOT_AVAILABLE");
  }

  const cart = await getOrCreateActiveCart(supabase, sessionId);

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    cart_id: cart.id,
    variant_id: variantId,
    quantity,
    unit_price_snapshot_usd: variant.price_usd,
  });
  if (error) throw error;
}

export async function updateCartItemQuantity(
  supabase: DB,
  sessionId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const cart = await getOrCreateActiveCart(supabase, sessionId);

  const { data: item } = await supabase
    .from("cart_items")
    .select("id")
    .eq("id", itemId)
    .eq("cart_id", cart.id) // nunca confiar en el itemId solo: debe pertenecer a ESTE carrito
    .maybeSingle();

  if (!item) throw new CartError("Ítem de carrito no encontrado", "ITEM_NOT_FOUND");

  if (quantity < 1 || !Number.isInteger(quantity)) {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId);
  if (error) throw error;
}

export async function removeCartItem(
  supabase: DB,
  sessionId: string,
  itemId: string,
): Promise<void> {
  const cart = await getOrCreateActiveCart(supabase, sessionId);
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cart.id);
  if (error) throw error;
}
