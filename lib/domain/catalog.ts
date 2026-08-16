import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import type { ProductListItem, ProductDetail } from "@/lib/domain/catalog-types";

type DB = SupabaseClient<Database>;

export type { ProductListItem, ProductDetail } from "@/lib/domain/catalog-types";

export interface CatalogFilters {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
  /** IDs explícitos (modo "manual" de un slider del Home — sección 19 del plan). */
  productIds?: string[];
  onlyFeatured?: boolean;
  onlyNew?: boolean;
  onlyBestseller?: boolean;
  /** Filtros avanzados de /catalogo (sección 8/46 del plan). El precio vive en `product_variants`, no en `products`, así que estos dos solo pueden aplicarse después de leer los precios — ver nota en la implementación. */
  minPriceUsd?: number;
  maxPriceUsd?: number;
  sort?: "recientes" | "precio_asc" | "precio_desc";
}

/**
 * Listado público de catálogo. Solo lee `products` con status='published'
 * — la policy de RLS (`public_read_products_published`) ya lo exige
 * también a nivel de base de datos, esto es además una capa de intención
 * explícita en el código, no la única defensa.
 */
export async function listPublishedProducts(
  supabase: DB,
  filters: CatalogFilters = {},
): Promise<ProductListItem[]> {
  // Se resuelve slug → id ANTES de filtrar productos en vez de filtrar
  // sobre una relación embebida de PostgREST: es más explícito y evita la
  // trampa de que un filtro sobre una tabla embebida sin `!inner` no
  // restringe realmente las filas del recurso principal.
  let categoryId: string | null = null;
  if (filters.categorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    categoryId = data?.id ?? null;
    if (!categoryId) return []; // categoría inexistente: sin resultados, no un error
  }

  let brandId: string | null = null;
  if (filters.brandSlug) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", filters.brandSlug)
      .maybeSingle();
    brandId = data?.id ?? null;
    if (!brandId) return [];
  }

  // El precio (para filtrar/ordenar por rango) vive en `product_variants`,
  // no en `products` — no se puede aplicar como filtro SQL directo sobre
  // esta consulta ni paginar con precisión perfecta en base de datos sin
  // una vista materializada. Para el tamaño real de catálogo de una
  // zapatería (decenas/cientos de productos, no millones), se trae un
  // lote más amplio y se filtra/ordena/pagina en memoria — trade-off
  // documentado, no un descuido: revisar si el catálogo crece mucho.
  const needsPricePostFilter =
    filters.minPriceUsd !== undefined ||
    filters.maxPriceUsd !== undefined ||
    filters.sort === "precio_asc" ||
    filters.sort === "precio_desc";

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, is_new, is_featured, is_bestseller, badge_custom,
       product_images(url, is_primary, order),
       product_variants(price_usd, compare_at_price_usd, status)`,
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (needsPricePostFilter) {
    query = query.range(0, 499);
  } else {
    query = query.range(
      filters.offset ?? 0,
      (filters.offset ?? 0) + (filters.limit ?? 24) - 1,
    );
  }

  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters.productIds) {
    if (filters.productIds.length === 0) return []; // lista manual vacía: sin resultados, no "todos"
    query = query.in("id", filters.productIds);
  }
  if (filters.onlyFeatured) query = query.eq("is_featured", true);
  if (filters.onlyNew) query = query.eq("is_new", true);
  if (filters.onlyBestseller) query = query.eq("is_bestseller", true);

  const { data, error } = await query;
  if (error) throw error;

  // El modo manual (`productIds`) debe respetar el orden que el admin
  // eligió al armar el bloque, no el orden de creación del producto.
  const ordered = filters.productIds
    ? [...(data ?? [])].sort(
        (a, b) => filters.productIds!.indexOf(a.id) - filters.productIds!.indexOf(b.id),
      )
    : (data ?? []);

  let mapped = ordered.map((product) => {
    const images = product.product_images ?? [];
    const primary =
      images.find((img) => img.is_primary) ??
      [...images].sort((a, b) => a.order - b.order)[0] ??
      null;

    const activeVariants = (product.product_variants ?? []).filter(
      (v) => v.status === "active",
    );
    const prices = activeVariants.map((v) => v.price_usd);
    const compareAtPrices = activeVariants
      .map((v) => v.compare_at_price_usd)
      .filter((p): p is number => p !== null);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      isNew: product.is_new,
      isFeatured: product.is_featured,
      isBestseller: product.is_bestseller,
      badgeCustom: product.badge_custom,
      primaryImageUrl: primary?.url ?? null,
      minPriceUsd: prices.length > 0 ? Math.min(...prices) : null,
      maxCompareAtPriceUsd:
        compareAtPrices.length > 0 ? Math.max(...compareAtPrices) : null,
    };
  });

  if (filters.minPriceUsd !== undefined) {
    mapped = mapped.filter(
      (p) => p.minPriceUsd !== null && p.minPriceUsd >= filters.minPriceUsd!,
    );
  }
  if (filters.maxPriceUsd !== undefined) {
    mapped = mapped.filter(
      (p) => p.minPriceUsd !== null && p.minPriceUsd <= filters.maxPriceUsd!,
    );
  }
  if (filters.sort === "precio_asc") {
    mapped = [...mapped].sort(
      (a, b) => (a.minPriceUsd ?? Infinity) - (b.minPriceUsd ?? Infinity),
    );
  } else if (filters.sort === "precio_desc") {
    mapped = [...mapped].sort(
      (a, b) => (b.minPriceUsd ?? -Infinity) - (a.minPriceUsd ?? -Infinity),
    );
  }

  if (needsPricePostFilter) {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 24;
    mapped = mapped.slice(offset, offset + limit);
  }

  return mapped;
}

export async function getPublishedProductBySlug(
  supabase: DB,
  slug: string,
): Promise<ProductDetail | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, sku, description_short, description, material, seo_title, seo_description,
       product_images(url, alt_text, order, is_primary),
       product_options(id, name, order, product_option_values(id, value, extra, order)),
       product_variants(id, sku, price_usd, compare_at_price_usd, status,
         variant_option_values(option_value_id),
         variant_images(product_images(url, alt_text)))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    descriptionShort: product.description_short,
    description: product.description,
    material: product.material,
    seoTitle: product.seo_title,
    seoDescription: product.seo_description,
    images: (product.product_images ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        url: img.url,
        altText: img.alt_text,
        order: img.order,
        isPrimary: img.is_primary,
      })),
    options: (product.product_options ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((opt) => ({
        id: opt.id,
        name: opt.name,
        values: (opt.product_option_values ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((val) => ({
            id: val.id,
            value: val.value,
            extra: (val.extra ?? {}) as Record<string, unknown>,
          })),
      })),
    variants: (product.product_variants ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceUsd: variant.price_usd,
      compareAtPriceUsd: variant.compare_at_price_usd,
      status: variant.status,
      optionValueIds: (variant.variant_option_values ?? []).map((v) => v.option_value_id),
      images: (variant.variant_images ?? [])
        .map((vi) => {
          const img = vi.product_images;
          if (!img) return null;
          return { url: img.url, altText: img.alt_text ?? "" };
        })
        .filter((x): x is { url: string; altText: string } => x !== null),
    })),
  };
}
