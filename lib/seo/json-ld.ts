/**
 * Constructores de datos estructurados Schema.org (sección 22 del plan).
 * Módulo puro — sin `server-only` ni imports de Next — para poder usarse
 * tanto desde Server Components (donde vive toda la data real) como
 * potencialmente desde tests. Cada función devuelve un objeto plano listo
 * para `JSON.stringify` dentro de un `<script type="application/ld+json">`.
 */

const SITE_NAME = "Zoe Shoes";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl()}${item.path}`,
    })),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description: string | null;
  slug: string;
  sku: string | null;
  imageUrls: string[];
  minPriceUsd: number;
  maxPriceUsd: number;
  /** Al menos una variante con stock disponible en alguna sucursal. */
  hasStock: boolean;
  brandName?: string;
}

/**
 * `Product` + `Offer` (sección 22 del plan). Se usa `AggregateOffer`
 * cuando el producto tiene variantes con precios distintos — el caso
 * normal es un solo precio (todas las tallas cuestan lo mismo), pero el
 * dato real puede variar por variante, así que no se asume.
 */
export function buildProductJsonLd(input: ProductJsonLdInput) {
  const offer =
    input.minPriceUsd === input.maxPriceUsd
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price: input.minPriceUsd.toFixed(2),
          availability: input.hasStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${siteUrl()}/producto/${input.slug}`,
        }
      : {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: input.minPriceUsd.toFixed(2),
          highPrice: input.maxPriceUsd.toFixed(2),
          availability: input.hasStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${siteUrl()}/producto/${input.slug}`,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    sku: input.sku ?? undefined,
    image: input.imageUrls,
    brand: input.brandName ? { "@type": "Brand", name: input.brandName } : undefined,
    offers: offer,
  };
}

export interface LocalBusinessJsonLdInput {
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  openingHours: { dayOfWeek: string; opens: string; closes: string }[];
}

/** `LocalBusiness` por sucursal (sección 22/48 del plan — clave para SEO local "zapatería cerca de mí" en Valencia). */
export function buildLocalBusinessJsonLd(input: LocalBusinessJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    name: `${SITE_NAME} — ${input.name}`,
    url: `${siteUrl()}/tiendas/${input.slug}`,
    telephone: input.phone ?? undefined,
    address: input.address
      ? {
          "@type": "PostalAddress",
          streetAddress: input.address,
          addressLocality: input.city ?? undefined,
          addressRegion: input.state ?? undefined,
          addressCountry: "VE",
        }
      : undefined,
    geo:
      input.lat !== null && input.lng !== null
        ? { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lng }
        : undefined,
    openingHoursSpecification: input.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
  };
}

/** Envuelve cualquier objeto JSON-LD en el `<script>` que espera Google. Server Component friendly (no requiere "use client"). */
export function jsonLdScriptProps(data: unknown): {
  type: string;
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    type: "application/ld+json",
    // JSON.stringify de datos propios (nunca HTML de usuario sin escapar) —
    // no es el mismo riesgo de XSS que `dangerouslySetInnerHTML` con
    // contenido arbitrario (regla permanente de seguridad del proyecto).
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
