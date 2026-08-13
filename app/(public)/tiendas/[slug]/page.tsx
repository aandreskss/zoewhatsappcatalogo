import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  buildLocalBusinessJsonLd,
  buildBreadcrumbJsonLd,
  jsonLdScriptProps,
} from "@/lib/seo/json-ld";

export const revalidate = 300;

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const SCHEMA_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function getStore(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: store } = await supabase
    .from("stores")
    .select(
      "id, name, slug, address, city, state, phone, whatsapp, lat, lng, google_maps_url",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!store) return null;

  const { data: hours } = await supabase
    .from("store_hours")
    .select("day_of_week, opens_at, closes_at, closed")
    .eq("store_id", store.id)
    .order("day_of_week");

  return { store, hours: hours ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStore(slug);
  if (!result) return {};
  const { store } = result;
  const description = store.address
    ? `${store.name} — ${store.address}${store.city ? `, ${store.city}` : ""}. Retiro en tienda y coordinación de pedidos por WhatsApp.`
    : `${store.name} — coordinación de pedidos por WhatsApp.`;

  return {
    title: store.name,
    description,
    alternates: { canonical: `/tiendas/${store.slug}` },
  };
}

/**
 * Landing SEO local por sucursal (sección 22/48 del plan): `LocalBusiness`
 * schema con NAP (nombre/dirección/teléfono) consistente con lo que
 * `admin/entrega/horarios` y `admin/entrega/pickup` administran — nunca
 * datos inventados o distintos a los que ve el cliente en checkout/WhatsApp.
 */
export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getStore(slug);
  if (!result) notFound();
  const { store, hours } = result;

  const openingHours = hours
    .filter((h) => !h.closed && h.opens_at && h.closes_at)
    .map((h) => ({
      dayOfWeek: SCHEMA_DAY_NAMES[h.day_of_week] ?? "Monday",
      opens: h.opens_at!.slice(0, 5),
      closes: h.closes_at!.slice(0, 5),
    }));

  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    name: store.name,
    slug: store.slug,
    address: store.address,
    city: store.city,
    state: store.state,
    phone: store.phone,
    lat: store.lat,
    lng: store.lng,
    openingHours,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Tiendas", path: "/tiendas" },
    { name: store.name, path: `/tiendas/${store.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <script {...jsonLdScriptProps(localBusinessJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      <h1 className="text-2xl font-semibold">{store.name}</h1>
      {store.address ? (
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          {store.address}
          {store.city ? `, ${store.city}` : ""}
          {store.state ? `, ${store.state}` : ""}
        </p>
      ) : null}
      {store.phone ? (
        <p className="mt-1 text-[var(--color-muted-foreground)]">Tel: {store.phone}</p>
      ) : null}
      {store.google_maps_url ? (
        <a
          href={store.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-[var(--color-primary)] underline"
        >
          Ver en Google Maps
        </a>
      ) : null}

      <h2 className="mt-6 mb-2 font-medium">Horario</h2>
      <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
        {DAY_LABELS.map((label, dayOfWeek) => {
          const row = hours.find((h) => h.day_of_week === dayOfWeek);
          return (
            <li key={dayOfWeek} className="flex items-center justify-between py-1.5">
              <span>{label}</span>
              <span className="text-[var(--color-muted-foreground)]">
                {!row || row.closed || !row.opens_at || !row.closes_at
                  ? "Cerrado"
                  : `${row.opens_at.slice(0, 5)} – ${row.closes_at.slice(0, 5)}`}
              </span>
            </li>
          );
        })}
      </ul>

      {store.whatsapp ? (
        <a
          href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
        >
          Escribir por WhatsApp
        </a>
      ) : null}
    </main>
  );
}
