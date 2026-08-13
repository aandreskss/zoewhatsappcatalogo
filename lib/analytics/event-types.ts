/**
 * Taxonomía de eventos internos (sección 21 del plan) — módulo puro, sin
 * `server-only` ni imports de Next, para poder usarse desde componentes
 * cliente y servidor por igual.
 */
export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "view_product",
  "search",
  "filter_applied",
  "view_category",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "checkout_completed",
  "whatsapp_clicked",
  "favorite_added",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** Embudo medido por el dashboard (sección 21 del plan) — el orden importa, se usa para calcular tasas de conversión entre pasos consecutivos. */
export const FUNNEL_STEPS: AnalyticsEventType[] = [
  "page_view",
  "view_product",
  "add_to_cart",
  "begin_checkout",
  "checkout_completed",
];
