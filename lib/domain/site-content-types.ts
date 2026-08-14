export interface NavLink {
  label: string;
  href: string;
}

export interface SiteContent {
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaHref: string;
  catalogLabel: string;
  promoLabel: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCtaText: string;
  promoCtaHref: string;
  whatsapp: string;
  instagram: string;
  navLinks: NavLink[];
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroLabel: "Nueva colección",
  heroTitle: "Encuentra tu próximo favorito.",
  heroSubtitle:
    "Descubre los nuevos modelos de Zoe. Diseñados para cada momento, pensados para ti.",
  heroCtaText: "Ver colección",
  heroCtaHref: "/catalogo",
  catalogLabel: "Colección SS 2025",
  promoLabel: "Colección especial",
  promoTitle: "Camina a tu manera.",
  promoSubtitle:
    "Encuentra modelos para cada momento de tu vida. Desde el trabajo hasta la noche.",
  promoCtaText: "Descubrir",
  promoCtaHref: "/catalogo",
  whatsapp: "584241234567",
  instagram: "@zoe.valencia",
  navLinks: [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Tiendas", href: "/tiendas" },
  ],
};
