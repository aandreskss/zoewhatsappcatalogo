import Link from "next/link";
import Image from "next/image";
import type { HomeSectionView } from "@/lib/domain/home";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import { BannerCarousel } from "@/components/home/banner-carousel";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  damas:
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80&auto=format&fit=crop",
  caballeros:
    "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80&auto=format&fit=crop",
  deportivos:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop",
  escolares:
    "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&q=80&auto=format&fit=crop",
  "adulto-mayor":
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80&auto=format&fit=crop",
  "tallas-plus":
    "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=80&auto=format&fit=crop",
};

/**
 * Renderiza un bloque ya resuelto (ver `lib/domain/home.ts`). Cada `case`
 * corresponde 1:1 a un `type` de `home_sections` — un tipo sin datos
 * resueltos (ej. colección inexistente) se omite en silencio en vez de
 * romper el resto de la página.
 */
export function HomeSectionRenderer({
  section,
  vesRate,
}: {
  section: HomeSectionView;
  vesRate: number | null;
}) {
  switch (section.type) {
    case "hero": {
      const config = section.config as {
        imageUrl?: string;
        ctaLabel?: string;
        ctaUrl?: string;
      };
      return (
        <section className="relative flex min-h-[320px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)] px-6 py-16 text-center">
          {config.imageUrl ? (
            <Image
              src={config.imageUrl}
              alt={section.title ?? ""}
              fill
              className="object-cover"
              priority
            />
          ) : null}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {section.title ? (
              <h1 className="text-3xl font-semibold">{section.title}</h1>
            ) : null}
            {section.subtitle ? (
              <p className="max-w-md text-[var(--color-muted-foreground)]">
                {section.subtitle}
              </p>
            ) : null}
            {config.ctaLabel && config.ctaUrl ? (
              <Button asChild size="lg">
                <Link href={config.ctaUrl}>{config.ctaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </section>
      );
    }

    case "banner": {
      if (!section.banners || section.banners.length === 0) return null;
      return <BannerCarousel banners={section.banners} />;
    }

    case "categories": {
      if (!section.categories || section.categories.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {section.categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden text-center hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-muted)]">
                  {(category.imageUrl ?? CATEGORY_FALLBACK_IMAGES[category.slug]) ? (
                    <Image
                      src={category.imageUrl ?? CATEGORY_FALLBACK_IMAGES[category.slug]!}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0D8E8] to-[#F0B8D0]" />
                  )}
                </div>
                <p className="text-sm font-medium py-2 px-2">{category.name}</p>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "product_slider":
    case "collection": {
      if (!section.products || section.products.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <SectionHeading title={section.title} subtitle={section.subtitle} />
            {section.type === "collection" && section.collectionSlug ? (
              <Link
                href={`/coleccion/${section.collectionSlug}`}
                className="text-sm underline"
              >
                Ver todo
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {section.products.map((product) => (
              <ProductCard key={product.id} product={product} vesRate={vesRate} />
            ))}
          </div>
        </section>
      );
    }

    case "brands": {
      if (!section.brands || section.brands.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="flex flex-wrap items-center gap-6">
            {section.brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marca/${brand.slug}`}
                className="flex items-center gap-2"
              >
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={80}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium">{brand.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "stores": {
      if (!section.stores || section.stores.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="grid gap-3 sm:grid-cols-2">
            {section.stores.map((store) => (
              <Link
                key={store.id}
                href={`/tiendas/${store.slug}`}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 hover:shadow-md"
              >
                <p className="font-medium">{store.name}</p>
                {store.address ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {store.address}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "image_text": {
      const config = section.config as {
        imageUrl?: string;
        ctaLabel?: string;
        ctaUrl?: string;
        align?: "left" | "right";
      };
      const reverse = config.align === "right";
      return (
        <section
          className={`flex flex-col items-center gap-6 sm:flex-row ${reverse ? "sm:flex-row-reverse" : ""}`}
        >
          {config.imageUrl ? (
            <div className="relative aspect-video w-full flex-1 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
              <Image
                src={config.imageUrl}
                alt={section.title ?? ""}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col gap-2">
            {section.title ? (
              <h2 className="text-xl font-semibold">{section.title}</h2>
            ) : null}
            {section.subtitle ? (
              <p className="text-[var(--color-muted-foreground)]">{section.subtitle}</p>
            ) : null}
            {config.ctaLabel && config.ctaUrl ? (
              <Button asChild size="sm" className="self-start">
                <Link href={config.ctaUrl}>{config.ctaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </section>
      );
    }

    case "cta": {
      const config = section.config as {
        imageUrl?: string;
        ctaLabel?: string;
        ctaUrl?: string;
      };
      return (
        <section className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-6 py-10 text-center text-[var(--color-primary-foreground)]">
          {section.title ? (
            <h2 className="text-2xl font-semibold">{section.title}</h2>
          ) : null}
          {section.subtitle ? <p>{section.subtitle}</p> : null}
          {config.ctaLabel && config.ctaUrl ? (
            <Button asChild variant="secondary" size="lg">
              <Link href={config.ctaUrl}>{config.ctaLabel}</Link>
            </Button>
          ) : null}
        </section>
      );
    }

    case "features": {
      const config = section.config as {
        items?: { title?: string; description?: string }[];
      };
      const items = config.items ?? [];
      if (items.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="grid gap-4 sm:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
              >
                {item.title ? <p className="font-medium">{item.title}</p> : null}
                {item.description ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "testimonials": {
      const config = section.config as { items?: { quote?: string; author?: string }[] };
      const items = config.items ?? [];
      if (items.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <blockquote
                key={index}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
              >
                <p className="italic">&ldquo;{item.quote}&rdquo;</p>
                {item.author ? (
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    — {item.author}
                  </p>
                ) : null}
              </blockquote>
            ))}
          </div>
        </section>
      );
    }

    case "instagram": {
      // Sin integración real a la API de Instagram (requeriría
      // credenciales/aprobación de Meta que no existen hoy) — el admin
      // carga las imágenes y enlaces a mano vía config.
      const config = section.config as {
        items?: { imageUrl?: string; linkUrl?: string }[];
      };
      const items = config.items ?? [];
      if (items.length === 0) return null;
      return (
        <section className="flex flex-col gap-3">
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.linkUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]"
              >
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string | null;
  subtitle: string | null;
}) {
  if (!title && !subtitle) return null;
  return (
    <div>
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      {subtitle ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
