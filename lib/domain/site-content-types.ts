export interface NavLink {
  label: string;
  href: string;
}

export interface SiteContent {
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCtaText: string;
  heroCtaHref: string;
  catalogLabel: string;
  promoLabel: string;
  promoTitle: string;
  promoSubtitle: string;
  promoImageUrl: string;
  promoCtaText: string;
  promoCtaHref: string;
  whatsapp: string;
  instagram: string;
  navLinks: NavLink[];
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroLabel: "20 años vistiendo tus pasos",
  heroTitle: "El zapato ideal para cada momento.",
  heroSubtitle:
    "Calzado para toda la familia: damas, caballeros, deportivo, escolar y más. Calidad y variedad en Valencia.",
  heroImageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=85&auto=format&fit=crop",
  heroCtaText: "Ver colección",
  heroCtaHref: "/catalogo",
  catalogLabel: "Catálogo Zoe Shop",
  promoLabel: "Especialidad Zoe",
  promoTitle: "Tacones, stilettos y confort.",
  promoSubtitle:
    "Tacones importados, quinceañeras, deportivo y sandalias ortopédicas. Todo en un solo lugar.",
  promoImageUrl: "",
  promoCtaText: "Descubrir",
  promoCtaHref: "/catalogo",
  whatsapp: "584244738930",
  instagram: "@Zoe_dist",
  navLinks: [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Tiendas", href: "/tiendas" },
  ],
};
