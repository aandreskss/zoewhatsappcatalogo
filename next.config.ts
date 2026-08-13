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
    ],
  },
  async headers() {
    return [
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
