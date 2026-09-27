export interface LPConfig {
  slug: string
  headline: string
  accentText: string
  subheadline: string
  deadline: Date
  discountPercent: number
  whatsappNumber: string
  whatsappMessage: string
  categorySlug?: string
  badgeText: string
  formTitle: string
  formSubtitle: string
  ctaLabel: string
  source: string
}

const LP_REGISTRY: Record<string, LPConfig> = {
  promo50: {
    slug: "promo50",
    headline: "Tacones Importados",
    accentText: "al 50% OFF",
    subheadline:
      "La oferta más grande del año — la colección más exclusiva de calzado importado al precio más bajo. Solo por 7 días.",
    deadline: new Date("2026-10-03T23:59:59-04:00"),
    discountPercent: 50,
    whatsappNumber: "584244738930",
    whatsappMessage:
      "¡Hola! Vi la promo del 50% en tacones y quisiera más información 👠",
    categorySlug: "damas",
    badgeText: "⚡ Promo exclusiva · Solo por 7 días",
    formTitle: "Accede a tu precio especial",
    formSubtitle:
      "Déjanos tu nombre y WhatsApp. Te enviamos el catálogo completo con los precios de la promoción directamente.",
    ctaLabel: "¡Pide tu 50% de descuento ahora! 👠",
    source: "lp_promo50",
  },
}

export function getLPConfig(slug: string): LPConfig | null {
  return LP_REGISTRY[slug] ?? null
}
