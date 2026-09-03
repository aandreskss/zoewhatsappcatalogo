import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getHomeSections } from "@/lib/domain/home";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/domain/site-content";
import { HomeSectionRenderer } from "@/components/home/home-section-renderer";
import { buildOrganizationJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import Link from "next/link";
import type { SiteContent } from "@/lib/domain/site-content-types";

export const revalidate = 60;
export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let sections: Awaited<ReturnType<typeof getHomeSections>> = [];
  let vesRate: Awaited<ReturnType<typeof getVesReferenceRate>> = null;
  let content: SiteContent = DEFAULT_SITE_CONTENT;
  try {
    const supabase = createSupabaseServiceRoleClient();
    [sections, vesRate, content] = await Promise.all([
      getHomeSections(supabase),
      getVesReferenceRate(supabase),
      getSiteContent(supabase),
    ]);
  } catch {
    // Sin Supabase configurado, muestra el estado vacío
  }

  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <div className="bg-[var(--color-background)]">
      <script {...jsonLdScriptProps(organizationJsonLd)} />

      {/* HERO */}
      <section className="relative h-[90vh] overflow-hidden bg-[var(--color-beige)]">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #F0D8E8 0%, #C98CA0 50%, #7B1847 100%)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(41,37,42,0.25) 100%)" }} />

        <div className="absolute bottom-10 left-6 right-6 md:bottom-16 md:left-16 md:right-auto md:max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-3">
            {content.heroLabel}
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-white leading-tight mb-4">
            {content.heroTitle}
          </h1>
          <p className="text-sm text-white/70 mb-8 leading-relaxed max-w-xs">
            {content.heroSubtitle}
          </p>
          <Link
            href={content.heroCtaHref}
            className="inline-flex items-center gap-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm font-semibold px-7 py-3.5 rounded-[var(--radius-md)] hover:bg-white transition-colors duration-150"
          >
            {content.heroCtaText}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>


      </section>

      {/* CMS SECTIONS */}
      {sections.length > 0 ? (
        <main className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-8">
          {sections.map((section) => (
            <HomeSectionRenderer
              key={section.id}
              section={section}
              vesRate={vesRate?.rate ?? null}
            />
          ))}
        </main>
      ) : (
        <section className="py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-rose-light)] flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl text-[var(--color-foreground)] mb-3">Bienvenido a Zoe Shop</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-8 max-w-sm mx-auto leading-relaxed">
            El catálogo está casi listo. Explora todos los modelos disponibles.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold px-6 py-3 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            Ver catálogo
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

      {/* PROMO BANNER */}
      <section className="mx-6 md:mx-12 rounded-[var(--radius-xl)] overflow-hidden my-16 md:my-24" style={{ backgroundColor: "#F0D8E8" }}>
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 p-10 md:p-16 order-2 md:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-4">
              {content.promoLabel}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[var(--color-foreground)] leading-tight mb-4">
              {content.promoTitle}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-8 max-w-xs leading-relaxed">
              {content.promoSubtitle}
            </p>
            <Link
              href={content.promoCtaHref}
              className="inline-flex items-center gap-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold px-6 py-3 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
            >
              {content.promoCtaText}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="w-full md:w-80 h-64 md:h-80 bg-[var(--color-rose-light)] order-1 md:order-2 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
            </svg>
          </div>
        </div>
      </section>

      {/* STORES */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-2">Encuéntranos</p>
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-foreground)]">Visítanos en Valencia</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              name: "Zoe Centro",
              address: "Calle Independencia esq. Díaz Moreno, C.C. ilduomo Local LB01, Valencia 2001",
              hours: "Lun–Sáb: 9am – 7pm · Dom: 10am – 4pm",
            },
            {
              name: "Zoe Av. Bolívar",
              address: "Av. Bolívar Norte, al lado del C.C. Villa Alegre, Valencia 2001",
              hours: "Lun–Sáb: 10am – 8pm · Dom: 11am – 5pm",
            },
          ].map((store) => (
            <div key={store.name} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-lavender)] flex items-center justify-center flex-none mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-foreground)] text-[15px]">{store.name}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{store.address}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5 ml-11">{store.hours}</p>
              <div className="flex gap-2 ml-11">
                <Link
                  href="/tiendas"
                  className="text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  Ver ubicación
                </Link>
                <a
                  href={`https://wa.me/${content.whatsapp.replace(/^\+/, "").replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-rose-light)] text-[var(--color-primary)] hover:opacity-90 transition-opacity"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
