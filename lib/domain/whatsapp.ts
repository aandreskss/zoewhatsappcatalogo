import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import {
  renderWhatsAppTemplate,
  type WhatsAppOrderItemLine,
} from "@/lib/domain/whatsapp-shared";

type DB = SupabaseClient<Database>;

export { buildWhatsAppLink } from "@/lib/domain/whatsapp-shared";

/**
 * Resuelve a qué número de WhatsApp se envía el pedido (decisión
 * confirmada: siempre el de la sucursal elegida, con respaldo al WhatsApp
 * principal — sección 17/31 del plan).
 */
export async function resolveWhatsAppNumber(
  supabase: DB,
  storeId: string | null,
): Promise<string> {
  if (storeId) {
    const { data: store } = await supabase
      .from("stores")
      .select("whatsapp")
      .eq("id", storeId)
      .maybeSingle();
    if (store?.whatsapp) return store.whatsapp;
  }

  const { data: company } = await supabase
    .from("company")
    .select("whatsapp_main")
    .limit(1)
    .maybeSingle();
  if (!company?.whatsapp_main) {
    throw new Error(
      "No hay WhatsApp configurado (ni de la sucursal ni principal de la empresa). Configúralo en /admin/empresa.",
    );
  }
  return company.whatsapp_main;
}

export async function getActiveWhatsAppTemplate(supabase: DB): Promise<string> {
  const { data } = await supabase
    .from("whatsapp_templates")
    .select("template")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (data?.template) return data.template;

  // Plantilla de respaldo si el admin borró todas las activas — el
  // pedido nunca debe quedar sin poder generar un mensaje.
  return "Hola 👋\nQuiero realizar el siguiente pedido:\n\nPedido: #{{order_number}}\n\n{{items}}\n\nSubtotal: {{subtotal}}\nTotal: {{total}}\n\nEntrega: {{delivery_method}} — {{store}}\nNombre: {{customer_name}}\nMétodo de pago: {{payment_method}}";
}

export async function buildOrderWhatsAppMessage(
  supabase: DB,
  params: {
    orderNumber: string;
    customerName: string;
    items: WhatsAppOrderItemLine[];
    subtotalLabel: string;
    totalLabel: string;
    deliveryMethodLabel: string;
    storeLabel: string;
    paymentMethodLabel: string;
  },
): Promise<string> {
  const template = await getActiveWhatsAppTemplate(supabase);
  return renderWhatsAppTemplate(template, {
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    items: params.items,
    subtotalLabel: params.subtotalLabel,
    totalLabel: params.totalLabel,
    deliveryMethodLabel: params.deliveryMethodLabel,
    storeLabel: params.storeLabel,
    paymentMethodLabel: params.paymentMethodLabel,
  });
}
