import type { NextConfig } from "next";

/**
 * Next.js config para Zoe Catalog.
 *
 * Notas:
 * - `images.remotePatterns` debe restringirse al/los dominio(s) reales de
 *   Supabase Storage (y Cloudinary si se adopta más adelante) tan pronto
 *   se conozca el proyecto de Supabase definitivo — nunca dejar `**` en
 *   producción.
 * - No colocar aquí ningún secreto: este archivo se empaqueta con el build.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF primero, WebP como fallback (sección 24 del plan) — Next.js ya
    // lo hace por defecto, se deja explícito para que quede documentado
    // como decisión y no como comportamiento implícito del framework.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Solo para desarrollo con datos de `seed.sql` (imágenes de
        // ejemplo). Quitar antes de producción si no se usa.
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        // Cloudinary como hosting de imágenes de producto (decisión del
        // usuario) — el código ya guarda `image_url` como texto libre, así
        // que cualquier URL https funciona; esto solo autoriza el dominio
        // para que `next/image` la pueda optimizar en vez de rechazarla.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Unsplash — imágenes de demo cargadas vía SQL seed. Reemplazables
        // desde /admin/productos sin tocar código.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    // Cabeceras de seguridad (sección 23 del plan). CSP permite
    // `'unsafe-inline'` en `script-src`/`style-src` a propósito, no por
    // descuido: `ThemeStyleOverride` inyecta un `<style>` con contenido
    // dinámico (los tokens del branding activo) y las integraciones de
    // analítica (`ThirdPartyScripts`) inyectan `<script>` inline (snippets
    // de GA4/GTM/Meta/TikTok) — ambos casos necesitarían CSP con nonce por
    // request (plumbing de middleware) para evitar `unsafe-inline` del
    // todo; se documenta como mejora futura en vez de fingir una CSP más
    // estricta de la que realmente aplica. `script-src` sigue restringido
    // a `'self'` + los orígenes exactos de los 3 proveedores de analítica
    // soportados (nunca `*`), que es donde CSP aporta la protección real
    // contra XSS de terceros no autorizados.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co https://res.cloudinary.com https://placehold.co https://www.facebook.com https://analytics.tiktok.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://analytics.tiktok.com https://www.facebook.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // El panel admin nunca debe indexarse, incluso si alguien
        // olvida el <meta name="robots"> en el layout.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
