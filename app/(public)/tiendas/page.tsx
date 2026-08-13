import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";

export const revalidate = 300;
export const metadata = {
  title: "Nuestras tiendas",
  alternates: { canonical: "/tiendas" },
};

/**
 * Índice de sucursales (sección 22 del plan — SEO local): enlaza a cada
 * landing `/tiendas/[slug]` con `LocalBusiness` schema. Sin esta página,
 * las landings individuales quedarían huérfanas de navegación interna.
 */
export default async function StoresIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, address, city, state, phone")
    .eq("active", true)
    .order("name");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Nuestras tiendas</h1>
      <ul className="flex flex-col gap-4">
        {(stores ?? []).map((store) => (
          <li
            key={store.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
          >
            <Link
              href={`/tiendas/${store.slug}`}
              className="text-lg font-medium hover:underline"
            >
              {store.name}
            </Link>
            {store.address ? (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {store.address}
                {store.city ? `, ${store.city}` : ""}
                {store.state ? `, ${store.state}` : ""}
              </p>
            ) : null}
            {store.phone ? (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {store.phone}
              </p>
            ) : null}
          </li>
        ))}
        {(stores ?? []).length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay sucursales activas configuradas.
          </li>
        ) : null}
      </ul>
    </main>
  );
}
