import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { IntegrationForm } from "@/components/admin/integration-form";

export const dynamic = "force-dynamic";

const PROVIDERS = [
  {
    provider: "ga4" as const,
    label: "Google Analytics 4",
    fieldLabel: "Measurement ID",
    placeholder: "G-XXXXXXXXXX",
    configKey: "measurementId",
  },
  {
    provider: "gtm" as const,
    label: "Google Tag Manager",
    fieldLabel: "Container ID",
    placeholder: "GTM-XXXXXXX",
    configKey: "containerId",
  },
  {
    provider: "meta_pixel" as const,
    label: "Meta Pixel",
    fieldLabel: "Pixel ID",
    placeholder: "123456789012345",
    configKey: "pixelId",
  },
  {
    provider: "tiktok" as const,
    label: "TikTok Pixel",
    fieldLabel: "Pixel ID",
    placeholder: "ABCDEFGHIJKLMNOPQRST",
    configKey: "pixelId",
  },
  {
    provider: "google_search_console" as const,
    label: "Google Search Console",
    fieldLabel: "Código de verificación",
    placeholder: "AbCdEfGhIjKlMnOpQrSt1234567890abcde",
    configKey: "verificationCode",
    activeLabel: "Activo (inserta la meta tag de verificación en el sitio)",
    hint: 'En Search Console → Agregar propiedad → método "Etiqueta HTML": copia solo el valor del atributo content (sin las comillas ni la etiqueta completa).',
  },
];

/**
 * Sección 21/26 del plan. Meta CAPI y Google Ads (conversiones
 * server-side) no se administran aquí todavía — requieren tokens/secretos
 * server-side reales que no existen en esta fase (ver comentario en
 * `ThirdPartyScripts`); se documenta como pendiente en vez de simular una
 * integración que no funcionaría.
 */
export default async function AnalyticsIntegrationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("integrations")
    .select("provider, public_config, active")
    .in("provider", PROVIDERS.map((p) => p.provider));

  const byProvider = new Map((data ?? []).map((row) => [row.provider, row]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Integraciones de analítica</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Los IDs configurados aquí cargan sus scripts en el sitio público solo si están
          activos. Sin ninguna integración activa, no se carga ningún script de terceros.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const row = byProvider.get(p.provider);
          const config = (row?.public_config ?? {}) as Record<string, unknown>;
          const currentValue =
            typeof config[p.configKey] === "string"
              ? (config[p.configKey] as string)
              : "";
          return (
            <IntegrationForm
              key={p.provider}
              provider={p.provider}
              label={p.label}
              fieldLabel={p.fieldLabel}
              placeholder={p.placeholder}
              currentValue={currentValue}
              currentActive={row?.active ?? false}
              activeLabel={"activeLabel" in p ? p.activeLabel : undefined}
              hint={"hint" in p ? p.hint : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
