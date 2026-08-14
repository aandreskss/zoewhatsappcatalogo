import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getHomeSections } from "@/lib/domain/home";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { HomeSectionRenderer } from "@/components/home/home-section-renderer";
import { buildOrganizationJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";

export const revalidate = 60;
export const metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home pública (sección 5/19/28 del plan) — completamente compuesta de
 * bloques administrables desde `/admin/marketing/home`, en el orden que
 * el admin haya definido. Si todavía no hay bloques configurados (recién
 * desplegado), muestra un estado vacío honesto en vez de una página en
 * blanco.
 */
export default async function HomePage() {
  let sections: Awaited<ReturnType<typeof getHomeSections>> = [];
  let vesRate: Awaited<ReturnType<typeof getVesReferenceRate>> = null;
  try {
    const supabase = await createSupabaseServerClient();
    [sections, vesRate] = await Promise.all([
      getHomeSections(supabase),
      getVesReferenceRate(supabase),
    ]);
  } catch {
    // Sin Supabase configurado, muestra el estado vacío
  }

  const organizationJsonLd = buildOrganizationJsonLd();

  if (sections.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <script {...jsonLdScriptProps(organizationJsonLd)} />
        <h1 className="text-2xl font-semibold">Zoe Shoes</h1>
        <p className="max-w-md text-[var(--color-muted-foreground)]">
          El Home todavía no tiene bloques configurados. Ve a Marketing → Home en el panel
          admin para armarlo.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <script {...jsonLdScriptProps(organizationJsonLd)} />
      {sections.map((section) => (
        <HomeSectionRenderer
          key={section.id}
          section={section}
          vesRate={vesRate?.rate ?? null}
        />
      ))}
    </main>
  );
}
