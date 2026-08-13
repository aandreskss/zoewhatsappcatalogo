import type { MetadataRoute } from "next";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * `sitemap.xml` dinámico (sección 22 del plan): productos publicados,
 * categorías activas, marcas activas, colecciones activas y tiendas
 * activas. Usa el cliente de service role (no anon) porque este handler
 * corre en build/request time sin sesión de usuario, y las tablas ya
 * tienen policies públicas de lectura de todas formas — el service role
 * solo evita depender de que la cookie de sesión exista en este contexto.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServiceRoleClient();
  const base = siteUrl();

  const [
    { data: products },
    { data: categories },
    { data: brands },
    { data: collections },
    { data: stores },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(5000),
    supabase.from("categories").select("slug").eq("active", true).limit(500),
    supabase.from("brands").select("slug").eq("active", true).limit(500),
    supabase.from("collections").select("slug, updated_at").eq("active", true).limit(500),
    supabase.from("stores").select("slug").eq("active", true).limit(100),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/tiendas`, changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const product of products ?? []) {
    entries.push({
      url: `${base}/producto/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const category of categories ?? []) {
    entries.push({
      url: `${base}/categoria/${category.slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const brand of brands ?? []) {
    entries.push({
      url: `${base}/marca/${brand.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  for (const collection of collections ?? []) {
    entries.push({
      url: `${base}/coleccion/${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  for (const store of stores ?? []) {
    entries.push({
      url: `${base}/tiendas/${store.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
