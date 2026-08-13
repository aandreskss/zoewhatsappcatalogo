import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import type { CreateOrderInput } from "@/lib/validation/checkout";
import {
  calculateSubtotalUsd,
  calculateTotalUsd,
  formatDualPrice,
} from "@/lib/domain/pricing";
import { getVesReferenceRate } from "@/lib/domain/currency";
import { normalizePhone } from "@/lib/domain/phone";
import {
  resolveWhatsAppNumber,
  buildOrderWhatsAppMessage,
  buildWhatsAppLink,
} from "@/lib/domain/whatsapp";

type DB = SupabaseClient<Database>;

export class OrderError extends Error {
  constructor(
    message: string,
    public code:
      "EMPTY_CART" | "ITEM_UNAVAILABLE" | "INSUFFICIENT_STOCK" | "INVALID_DELIVERY",
  ) {
    super(message);
  }
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  publicAccessToken: string;
  isReplay: boolean;
  whatsappLink: string;
  whatsappMessage: string;
}

interface CartLineForOrder {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  variantLabel: string;
  unitPriceUsd: number;
  quantity: number;
  imageUrl: string | null;
}

async function loadCartLines(supabase: DB, cartId: string): Promise<CartLineForOrder[]> {
  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, variant_id, quantity")
    .eq("cart_id", cartId);
  if (error) throw error;
  if (!items || items.length === 0) return [];

  const variantIds = items.map((i) => i.variant_id);

  const [
    { data: variants, error: variantsError },
    { data: optionLinks },
    { data: imageLinks },
  ] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, price_usd, status, product_id, sku")
      .in("id", variantIds),
    supabase
      .from("variant_option_values")
      .select("variant_id, product_option_values(value)")
      .in("variant_id", variantIds),
    supabase
      .from("variant_images")
      .select("variant_id, product_images(url)")
      .in("variant_id", variantIds),
  ]);
  if (variantsError) throw variantsError;

  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, status, deleted_at")
    .in("id", productIds);
  if (productsError) throw productsError;

  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  const variantsById = new Map((variants ?? []).map((v) => [v.id, v]));

  const labelsByVariant = new Map<string, string[]>();
  for (const link of optionLinks ?? []) {
    const value = link.product_option_values?.value;
    if (!value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(value);
    labelsByVariant.set(link.variant_id, list);
  }

  const imageByVariant = new Map<string, string>();
  for (const link of imageLinks ?? []) {
    if (imageByVariant.has(link.variant_id)) continue;
    if (link.product_images?.url)
      imageByVariant.set(link.variant_id, link.product_images.url);
  }

  const lines: CartLineForOrder[] = [];
  for (const item of items) {
    const variant = variantsById.get(item.variant_id);
    const product = variant ? productsById.get(variant.product_id) : undefined;

    if (
      !variant ||
      !product ||
      variant.status !== "active" ||
      product.status !== "published" ||
      product.deleted_at
    ) {
      throw new OrderError(
        `El producto "${product?.name ?? item.variant_id}" ya no está disponible. Quítalo del carrito para continuar.`,
        "ITEM_UNAVAILABLE",
      );
    }

    lines.push({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      sku: variant.sku,
      variantLabel: (labelsByVariant.get(item.variant_id) ?? []).join(" / ") || "—",
      unitPriceUsd: variant.price_usd, // SIEMPRE el precio actual del catálogo, nunca el snapshot del carrito
      quantity: item.quantity,
      imageUrl: imageByVariant.get(item.variant_id) ?? null,
    });
  }

  return lines;
}

/** Sucursal con más stock disponible para una variante — usada como fulfillment implícito en delivery/envío nacional, donde el cliente no elige sucursal (ver sección 48 del plan: alcance de envío nacional queda pendiente de definición comercial más fina). */
async function pickFulfillmentStore(supabase: DB, variantId: string): Promise<string> {
  const { data, error } = await supabase
    .from("variant_availability")
    .select("store_id, available")
    .eq("variant_id", variantId)
    .order("available", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new OrderError(
      "No hay inventario configurado para uno de los productos del carrito.",
      "ITEM_UNAVAILABLE",
    );
  return data.store_id;
}

async function findOrCreateCustomer(
  supabase: DB,
  input: CreateOrderInput["customer"],
  source: CreateOrderInput["source"],
): Promise<string> {
  const phone = normalizePhone(input.phone);

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName || null,
      phone,
      email: input.email || null,
      source: source ?? {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function createOrder(
  supabase: DB,
  params: { cartId: string; input: CreateOrderInput },
): Promise<CreateOrderResult> {
  const lines = await loadCartLines(supabase, params.cartId);
  if (lines.length === 0) {
    throw new OrderError("Tu carrito está vacío.", "EMPTY_CART");
  }

  const subtotalUsd = calculateSubtotalUsd(
    lines.map((l) => ({ unitPriceUsd: l.unitPriceUsd, quantity: l.quantity })),
  );

  let shippingEstimateUsd = 0;
  let deliveryAddressId: string | null = null;
  let storeId: string | null = null;
  let shippingZoneId: string | null = null;

  const customerId = await findOrCreateCustomer(
    supabase,
    params.input.customer,
    params.input.source,
  );

  if (params.input.delivery.method === "pickup") {
    storeId = params.input.delivery.storeId;
  } else {
    if (params.input.delivery.method === "delivery") {
      const { data: zone } = await supabase
        .from("shipping_zones")
        .select("id, cost_usd")
        .eq("id", params.input.delivery.shippingZoneId)
        .eq("active", true)
        .maybeSingle();
      if (!zone)
        throw new OrderError(
          "La zona de delivery seleccionada ya no está disponible.",
          "INVALID_DELIVERY",
        );
      shippingZoneId = zone.id;
      shippingEstimateUsd = zone.cost_usd;
    }

    const { data: address, error: addressError } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        state: params.input.delivery.state,
        city: params.input.delivery.city,
        address: params.input.delivery.address,
        reference: params.input.delivery.reference || null,
      })
      .select("id")
      .single();
    if (addressError) throw addressError;
    deliveryAddressId = address.id;
  }

  const totalUsd = calculateTotalUsd({ subtotalUsd, shippingEstimateUsd });
  const vesRate = await getVesReferenceRate(supabase);

  const itemsPayload = await Promise.all(
    lines.map(async (line) => ({
      variant_id: line.variantId,
      product_name: line.productName,
      sku: line.sku,
      variant_label: line.variantLabel,
      unit_price_usd: line.unitPriceUsd,
      quantity: line.quantity,
      subtotal_usd: Math.round(line.unitPriceUsd * line.quantity * 100) / 100,
      image_url_snapshot: line.imageUrl,
      reservation_store_id:
        storeId ?? (await pickFulfillmentStore(supabase, line.variantId)),
    })),
  );

  const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order", {
    p_order: {
      customer_id: customerId,
      store_id: storeId ?? "",
      subtotal_usd: subtotalUsd,
      discount_usd: 0,
      shipping_estimate_usd: shippingEstimateUsd,
      total_usd: totalUsd,
      exchange_rate_used: vesRate?.rate ?? "",
      exchange_rate_currency_pair: vesRate?.currencyPair ?? "",
      exchange_rate_source: vesRate?.source ?? "",
      delivery_method: params.input.delivery.method,
      delivery_address_id: deliveryAddressId ?? "",
      shipping_zone_id: shippingZoneId ?? "",
      payment_method_id: params.input.paymentMethodId,
      payment_notes: params.input.paymentNotes ?? "",
      source: params.input.source ?? {},
      idempotency_key: params.input.idempotencyKey,
    },
    p_items: itemsPayload,
    p_reservation_ttl_minutes: 20,
  });

  if (rpcError) {
    if (rpcError.message.includes("INSUFFICIENT_STOCK")) {
      throw new OrderError(
        "Una de las tallas se agotó mientras completabas tu pedido. Vuelve al carrito para ajustar la cantidad.",
        "INSUFFICIENT_STOCK",
      );
    }
    throw rpcError;
  }

  const order = rpcResult?.[0];
  if (!order) throw new Error("create_order no devolvió resultado");

  // Vaciar el carrito solo si el pedido se creó de verdad ahora (no en un
  // replay por idempotencia, donde el carrito ya se vació la primera vez).
  if (!order.is_replay) {
    await supabase.from("carts").update({ status: "converted" }).eq("id", params.cartId);
  }

  const store = storeId
    ? (await supabase.from("stores").select("name").eq("id", storeId).maybeSingle()).data
    : null;

  const paymentMethod = (
    await supabase
      .from("payment_methods")
      .select("name")
      .eq("id", params.input.paymentMethodId)
      .maybeSingle()
  ).data;

  const deliveryLabel =
    params.input.delivery.method === "pickup"
      ? "Retiro en tienda"
      : params.input.delivery.method === "delivery"
        ? "Delivery"
        : "Envío nacional";

  const whatsappNumber = await resolveWhatsAppNumber(supabase, storeId);
  const whatsappMessage = await buildOrderWhatsAppMessage(supabase, {
    orderNumber: order.order_number,
    customerName:
      `${params.input.customer.firstName} ${params.input.customer.lastName ?? ""}`.trim(),
    items: lines.map((l) => ({
      productName: l.productName,
      variantLabel: l.variantLabel,
      quantity: l.quantity,
      unitPriceUsd: l.unitPriceUsd,
    })),
    subtotalLabel: formatDualPrice(subtotalUsd, vesRate?.rate ?? null),
    totalLabel: formatDualPrice(totalUsd, vesRate?.rate ?? null),
    deliveryMethodLabel: deliveryLabel,
    storeLabel: store?.name ?? "—",
    paymentMethodLabel: paymentMethod?.name ?? "—",
  });

  if (!order.is_replay) {
    await supabase
      .from("orders")
      .update({
        whatsapp_number_used: whatsappNumber,
        whatsapp_message_sent: whatsappMessage,
      })
      .eq("id", order.id);
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    publicAccessToken: order.public_access_token,
    isReplay: order.is_replay,
    whatsappLink: buildWhatsAppLink(whatsappNumber, whatsappMessage),
    whatsappMessage,
  };
}
