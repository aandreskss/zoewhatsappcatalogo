/**
 * Generación del mensaje y del enlace de WhatsApp — funciones puras (sin
 * DB, sin Next.js) para poder testearlas de forma aislada. Ver sección 17
 * del plan.
 */

export interface WhatsAppOrderItemLine {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface WhatsAppTemplateData {
  orderNumber: string;
  customerName: string;
  items: WhatsAppOrderItemLine[];
  subtotalLabel: string;
  totalLabel: string;
  deliveryMethodLabel: string;
  storeLabel: string;
  paymentMethodLabel: string;
}

const PLACEHOLDER_KEYS = [
  "order_number",
  "customer_name",
  "items",
  "subtotal",
  "total",
  "delivery_method",
  "store",
  "payment_method",
] as const;

/**
 * Quita saltos de línea/tabs/retornos de carro de un dato individual del
 * pedido antes de insertarlo en el mensaje — así un nombre con un salto
 * de línea pegado por error no rompe el formato de las demás líneas.
 */
function sanitizeForWhatsApp(value: string): string {
  return value.split("\n").join(" ").split("\r").join(" ").split("\t").join(" ").trim();
}

function formatItemsList(items: WhatsAppOrderItemLine[]): string {
  return items
    .map((item, index) => {
      const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(item.unitPriceUsd);
      return `${index + 1}. ${sanitizeForWhatsApp(item.productName)}\n   ${sanitizeForWhatsApp(item.variantLabel)}\n   Cantidad: ${item.quantity}\n   Precio: ${price}`;
    })
    .join("\n\n");
}

/**
 * Sustituye SOLO los placeholders controlados (`{{order_number}}`, etc.)
 * — el admin puede editar el texto alrededor en `whatsapp_templates`, pero
 * nunca inyecta datos del pedido; esos siempre vienen de aquí (regla
 * permanente: WhatsApp es un canal, no la base de datos — el mensaje se
 * genera a partir de datos reales, no de texto libre del admin).
 */
export function renderWhatsAppTemplate(
  template: string,
  data: WhatsAppTemplateData,
): string {
  const replacements: Record<(typeof PLACEHOLDER_KEYS)[number], string> = {
    order_number: sanitizeForWhatsApp(data.orderNumber),
    customer_name: sanitizeForWhatsApp(data.customerName),
    items: formatItemsList(data.items),
    subtotal: data.subtotalLabel,
    total: data.totalLabel,
    delivery_method: sanitizeForWhatsApp(data.deliveryMethodLabel),
    store: sanitizeForWhatsApp(data.storeLabel),
    payment_method: sanitizeForWhatsApp(data.paymentMethodLabel),
  };

  return PLACEHOLDER_KEYS.reduce(
    (message, key) => message.replaceAll(`{{${key}}}`, replacements[key]),
    template,
  );
}

/**
 * Enlace compatible con WhatsApp Android/iOS/Web/escritorio (sección 17
 * del plan: `wa.me`, no `whatsapp://` como único método).
 */
export function buildWhatsAppLink(phoneE164: string, message: string): string {
  const digitsOnly = phoneE164.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
