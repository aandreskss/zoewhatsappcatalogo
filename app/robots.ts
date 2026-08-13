import type { MetadataRoute } from "next";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * `robots.txt` (sección 22 del plan). El plan pide "robots.txt
 * administrable" — se deja como reglas fijas en código por ahora en vez de
 * una tabla editable desde el admin: solo hay una regla de negocio real
 * (nunca indexar `/admin` ni las rutas de API/checkout) y no hay todavía
 * un caso de uso concreto que requiera cambiarla sin desplegar. Se
 * documenta como V1.1 si surge la necesidad real de editarla sin deploy.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/carrito"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
