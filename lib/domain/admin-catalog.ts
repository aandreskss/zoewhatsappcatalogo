import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/db/supabase/types";
import { slugify, ensureUniqueSlug } from "@/lib/domain/slug";

type DB = SupabaseClient<Database>;

/**
 * Operaciones de escritura del catálogo usadas por el admin. Reciben el
 * `SupabaseClient` como parámetro (en vez de crearlo aquí adentro) para
 * poder testear esta lógica con un cliente falso — y porque quién debe
 * decidir con qué cliente correr (el del usuario autenticado, respetando
 * RLS como defensa en profundidad, o la service role) es la capa de
 * Route Handler/Server Action, no este módulo.
 */

export async function generateUniqueSlug(
  supabase: DB,
  table: "products" | "categories" | "brands",
  name: string,
): Promise<string> {
  const base = slugify(name);
  const { data } = await supabase.from(table).select("slug").ilike("slug", `${base}%`);
  const existing = new Set((data ?? []).map((row) => row.slug));
  return ensureUniqueSlug(base, existing);
}

/**
 * Registra en `redirects` cuando el slug de una entidad publicada cambia
 * (regla permanente: slugs no son IDs, un cambio de slug debe servir un
 * 301 — sección 22 del plan).
 */
export async function recordSlugChangeIfNeeded(
  supabase: DB,
  entityType: "product" | "category" | "collection",
  entityId: string,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  if (oldSlug === newSlug) return;
  const { error } = await supabase.from("redirects").insert({
    entity_type: entityType,
    entity_id: entityId,
    old_slug: oldSlug,
    new_slug: newSlug,
  });
  if (error) throw error;
}

/**
 * Encuentra (o crea) la opción "Color"/"Talla" del producto y el valor
 * concreto ("Negro", "38"). Simplificación deliberada de la Fase 2: el
 * formulario de admin asume que un calzado siempre varía por Color y
 * Talla — el modelo de datos subyacente sigue siendo genérico
 * (Product → Option → Value, sección 13 del plan), así que agregar un
 * tercer tipo de opción en el futuro no requiere cambiar el esquema, solo
 * ampliar este formulario.
 */
export async function getOrCreateOptionValue(
  supabase: DB,
  productId: string,
  optionName: "Color" | "Talla",
  value: string,
  extra: Record<string, Json> = {},
): Promise<string> {
  let { data: option } = await supabase
    .from("product_options")
    .select("id")
    .eq("product_id", productId)
    .eq("name", optionName)
    .maybeSingle();

  if (!option) {
    const order = optionName === "Color" ? 0 : 1;
    const { data: created, error } = await supabase
      .from("product_options")
      .insert({ product_id: productId, name: optionName, order })
      .select("id")
      .single();
    if (error) throw error;
    option = created;
  }

  const { data: existingValue } = await supabase
    .from("product_option_values")
    .select("id")
    .eq("option_id", option.id)
    .eq("value", value)
    .maybeSingle();

  if (existingValue) return existingValue.id;

  const { data: createdValue, error: valueError } = await supabase
    .from("product_option_values")
    .insert({ option_id: option.id, value, extra })
    .select("id")
    .single();
  if (valueError) throw valueError;
  return createdValue.id;
}

export async function createVariantWithOptions(
  supabase: DB,
  params: {
    productId: string;
    sku: string;
    priceUsd: number;
    compareAtPriceUsd: number | null;
    color: string;
    colorHex: string | null;
    size: string;
  },
): Promise<string> {
  const colorValueId = await getOrCreateOptionValue(
    supabase,
    params.productId,
    "Color",
    params.color,
    params.colorHex ? { hex: params.colorHex } : {},
  );
  const sizeValueId = await getOrCreateOptionValue(
    supabase,
    params.productId,
    "Talla",
    params.size,
  );

  const { data: variant, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: params.productId,
      sku: params.sku,
      price_usd: params.priceUsd,
      compare_at_price_usd: params.compareAtPriceUsd,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: linkError } = await supabase.from("variant_option_values").insert([
    { variant_id: variant.id, option_value_id: colorValueId },
    { variant_id: variant.id, option_value_id: sizeValueId },
  ]);
  if (linkError) throw linkError;

  return variant.id;
}
