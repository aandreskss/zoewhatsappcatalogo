import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Retiro en tienda",
  delivery: "Delivery",
  shipping: "Envío nacional",
};

const STATUS_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  enviado_whatsapp: "Enviado por WhatsApp",
  contactado: "Contactado",
  confirmado: "Confirmado",
  esperando_pago: "Esperando pago",
  pagado: "Pagado",
  preparando: "Preparando",
  listo_para_entregar: "Listo para entregar",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const statusParam = searchParams.get("status");
  const statuses = statusParam ? statusParam.split(",").filter(Boolean) : [];

  const supabase = await createSupabaseServerClient();

  type OrderRow = {
    order_number: string;
    created_at: string;
    status: string;
    delivery_method: string;
    subtotal_usd: number;
    discount_usd: number;
    shipping_estimate_usd: number;
    total_usd: number;
    exchange_rate_used: number | null;
    exchange_rate_currency_pair: string | null;
    payment_notes: string | null;
    customers: {
      first_name: string;
      last_name: string | null;
      phone: string;
      email: string | null;
      city: string | null;
      state: string | null;
    } | null;
    payment_methods: { name: string } | null;
    order_items: Array<{
      product_name: string;
      sku: string | null;
      variant_label: string | null;
      quantity: number;
      unit_price_usd: number;
      discount_usd: number;
      subtotal_usd: number;
    }>;
  };

  let query = supabase
    .from("orders")
    .select(
      `order_number, created_at, status, delivery_method,
       subtotal_usd, discount_usd, shipping_estimate_usd, total_usd,
       exchange_rate_used, exchange_rate_currency_pair, payment_notes,
       customers(first_name, last_name, phone, email, city, state),
       payment_methods(name),
       order_items(product_name, sku, variant_label, quantity, unit_price_usd, discount_usd, subtotal_usd)`,
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (statuses.length > 0) query = query.in("status", statuses);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []) as unknown as OrderRow[];

  const CSV_HEADERS = [
    "Número de pedido",
    "Fecha",
    "Estado",
    "Cliente",
    "Teléfono",
    "Email",
    "Método de pago",
    "Método de entrega",
    "Ciudad",
    "Estado/Provincia",
    "Producto",
    "SKU",
    "Variante",
    "Cantidad",
    "Precio unit. USD",
    "Descuento línea USD",
    "Subtotal línea USD",
    "Envío USD",
    "Total pedido USD",
    "Tasa de cambio",
    "Par de monedas",
    "Notas de pago",
  ];

  const rows: string[] = [CSV_HEADERS.map(csvCell).join(",")];

  for (const order of orders) {
    const c = order.customers;
    const customerName = [c?.first_name, c?.last_name].filter(Boolean).join(" ");
    const items = order.order_items ?? [];

    if (items.length === 0) {
      rows.push(
        [
          order.order_number,
          new Date(order.created_at).toLocaleDateString("es-VE"),
          STATUS_LABEL[order.status] ?? order.status,
          customerName,
          c?.phone ?? "",
          c?.email ?? "",
          order.payment_methods?.name ?? "",
          DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method,
          c?.city ?? "",
          c?.state ?? "",
          "", "", "", "", "", "", "",
          order.shipping_estimate_usd ?? 0,
          order.total_usd,
          order.exchange_rate_used ?? "",
          order.exchange_rate_currency_pair ?? "",
          order.payment_notes ?? "",
        ].map(csvCell).join(","),
      );
      continue;
    }

    items.forEach((item, i) => {
      rows.push(
        [
          order.order_number,
          new Date(order.created_at).toLocaleDateString("es-VE"),
          STATUS_LABEL[order.status] ?? order.status,
          customerName,
          c?.phone ?? "",
          c?.email ?? "",
          order.payment_methods?.name ?? "",
          DELIVERY_LABEL[order.delivery_method] ?? order.delivery_method,
          c?.city ?? "",
          c?.state ?? "",
          item.product_name,
          item.sku ?? "",
          item.variant_label ?? "",
          item.quantity,
          item.unit_price_usd,
          item.discount_usd ?? 0,
          item.subtotal_usd,
          i === 0 ? (order.shipping_estimate_usd ?? 0) : "",
          i === 0 ? order.total_usd : "",
          i === 0 ? (order.exchange_rate_used ?? "") : "",
          i === 0 ? (order.exchange_rate_currency_pair ?? "") : "",
          i === 0 ? (order.payment_notes ?? "") : "",
        ].map(csvCell).join(","),
      );
    });
  }

  const csv = "﻿" + rows.join("\r\n"); // BOM para Excel en Windows
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-fina-${date}.csv"`,
    },
  });
}
