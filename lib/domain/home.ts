import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import { listPublishedProducts, type ProductListItem } from "@/lib/domain/catalog";

type DB = SupabaseClient<Database>;

export type HomeSectionType =
  | "hero"
  | "banner"
  | "categories"
  | "product_slider"
  | "collection"
  | "image_text"
  | "cta"
  | "brands"
  | "features"
  | "testimonials"
  | "instagram"
  | "stores";

export interface BannerView {
  id: string;
  name: string;
  imageDesktopUrl: string | null;
  imageMobileUrl: string | null;
  headline: string | null;
  copy: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

export interface HomeSectionView {
  id: string;
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  /** Config cruda tal como la guardó el admin — cada bloque del render toma de aquí lo que necesita (ver comentario de `resolveSection`). */
  config: Record<string, unknown>;
  products?: ProductListItem[];
  collectionSlug?: string;
  categories?: { id: string; name: string; slug: string; imageUrl: string | null }[];
  brands?: { id: string; name: string; slug: string; logoUrl: string | null }[];
  stores?: { id: string; name: string; slug: string; address: string | null }[];
  banners?: BannerView[];
}

/**
 * Todos los banners activos para una posición, ordenados por prioridad
 * descendente y filtrados por ventana de fechas. El carousel los rota en orden.
 */
export async function getActiveBanners(
  supabase: DB,
  position = "home",
): Promise<BannerView[]> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("banners")
    .select(
      "id, name, image_desktop_url, image_mobile_url, headline, copy, cta_label, cta_url, starts_at, ends_at",
    )
    .eq("position", position)
    .eq("active", true)
    .order("priority", { ascending: false })
    .limit(20);

  return (data ?? [])
    .filter((banner) => {
      if (banner.starts_at && banner.starts_at > nowIso) return false;
      if (banner.ends_at && banner.ends_at < nowIso) return false;
      return true;
    })
    .map((banner) => ({
      id: banner.id,
      name: banner.name,
      imageDesktopUrl: banner.image_desktop_url,
      imageMobileUrl: banner.image_mobile_url,
      headline: banner.headline,
      copy: banner.copy,
      ctaLabel: banner.cta_label,
      ctaUrl: banner.cta_url,
    }));
}

/** @deprecated Usar `getActiveBanners` — retorna array para soporte de carousel. */
export async function getActiveBanner(
  supabase: DB,
  position = "home",
): Promise<BannerView | null> {
  const banners = await getActiveBanners(supabase, position);
  return banners[0] ?? null;
}

/**
 * Resuelve UN bloque del Home según su `type` (sección 19/28 del plan).
 *
 * Decisión de alcance deliberada para esta fase: el admin arma el
 * `config` de cada bloque como JSON estructurado (ver
 * `/admin/marketing/home`) en vez de un "page builder" visual campo por
 * campo para cada uno de los 12 tipos — eso sería una superficie de UI
 * enorme (sección de "no overengineering" de las instrucciones
 * permanentes). Lo que sí es requisito real (bloques administrables sin
 * tocar código, en el orden que el admin decida) queda cumplido; el
 * constructor visual completo queda anotado como mejora de V1.1.
 *
 * `features`/`testimonials`/`instagram` se renderizan directamente desde
 * `config` sin resolución de servidor — en particular, `instagram` NO
 * integra la API real de Instagram (requeriría credenciales/aprobación
 * de Meta que no existen hoy); el admin carga las imágenes/enlaces a
 * mano, honesto con la regla de "no inventar integraciones".
 */
async function resolveSection(
  supabase: DB,
  section: {
    id: string;
    type: HomeSectionType;
    title: string | null;
    subtitle: string | null;
    config: unknown;
  },
): Promise<HomeSectionView> {
  const config = (section.config ?? {}) as Record<string, unknown>;
  const base: HomeSectionView = {
    id: section.id,
    type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    config,
  };

  switch (section.type) {
    case "product_slider": {
      const mode = (config.mode as string) ?? "featured";
      const limit = typeof config.limit === "number" ? config.limit : 12;
      const products = await listPublishedProducts(supabase, {
        limit,
        productIds:
          mode === "manual" ? ((config.productIds as string[]) ?? []) : undefined,
        categorySlug:
          mode === "category" ? (config.categorySlug as string | undefined) : undefined,
        onlyFeatured: mode === "featured",
        onlyNew: mode === "new",
        onlyBestseller: mode === "bestseller",
      });
      return { ...base, products };
    }
    case "collection": {
      const slug = config.collectionSlug as string | undefined;
      if (!slug) return base;
      const { data: collection } = await supabase
        .from("collections")
        .select("id")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (!collection) return base;
      const { data: links } = await supabase
        .from("collection_products")
        .select("product_id")
        .eq("collection_id", collection.id)
        .order("order");
      const productIds = (links ?? []).map((l) => l.product_id);
      const products = await listPublishedProducts(supabase, {
        productIds,
        limit: typeof config.limit === "number" ? config.limit : 12,
      });
      return { ...base, products, collectionSlug: slug };
    }
    case "categories": {
      const ids = config.categoryIds as string[] | undefined;
      let query = supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("active", true)
        .order("order")
        .limit(typeof config.limit === "number" ? config.limit : 8);
      if (ids && ids.length > 0) query = query.in("id", ids);
      const { data } = await query;
      return {
        ...base,
        categories: (data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image_url,
        })),
      };
    }
    case "brands": {
      const { data } = await supabase
        .from("brands")
        .select("id, name, slug, logo_url")
        .eq("active", true)
        .order("name")
        .limit(typeof config.limit === "number" ? config.limit : 12);
      return {
        ...base,
        brands: (data ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoUrl: b.logo_url,
        })),
      };
    }
    case "stores": {
      const { data } = await supabase
        .from("stores")
        .select("id, name, slug, address")
        .eq("active", true)
        .order("name");
      return { ...base, stores: data ?? [] };
    }
    case "banner": {
      const position = (config.position as string) ?? "home";
      const banners = await getActiveBanners(supabase, position);
      return { ...base, banners };
    }
    case "hero":
    case "image_text":
    case "cta":
    case "features":
    case "testimonials":
    case "instagram":
    default:
      return base;
  }
}

export async function getHomeSections(supabase: DB): Promise<HomeSectionView[]> {
  const { data, error } = await supabase
    .from("home_sections")
    .select("id, type, title, subtitle, config")
    .eq("active", true)
    .order("order");
  if (error) throw error;

  return Promise.all((data ?? []).map((section) => resolveSection(supabase, section)));
}
