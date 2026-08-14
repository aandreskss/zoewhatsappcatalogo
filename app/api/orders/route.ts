import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validation/checkout";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import { getOrCreateActiveCart } from "@/lib/domain/cart";
import { createOrder, OrderError } from "@/lib/domain/orders";
import { getAttribution } from "@/lib/attribution";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * El endpoint más sensible del sitio público (sección 29/100 del plan).
 * Flujo obligatorio antes de tocar WhatsApp: validar → recalcular precios
 * en servidor → reservar stock con lock → crear cliente/pedido → generar
 * mensaje. Nada de esto confía en lo que mandó el navegador más allá de
 * "qué variantes y qué datos de contacto/entrega quiere el cliente".
 */
export async function POST(request: Request) {
  // Rate limit por IP (sección 23 del plan) — 8 pedidos cada 10 minutos es
  // generoso para un cliente real (incluso reintentando tras un error de
  // red) pero frena un script que intente inundar WhatsApp de pedidos
  // falsos. El honeypot en `createOrderSchema` (campo `website`) es la
  // segunda capa contra bots.
  const ip = getClientIp(request);
  const rate = checkRateLimit(`create-order:${ip}`, 8, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Demasiados pedidos en poco tiempo. Espera unos minutos e intenta de nuevo.",
      },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return NextResponse.json(
      { error: "No hay un carrito activo", code: "EMPTY_CART" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const cart = await getOrCreateActiveCart(supabase, sessionId);

  // La atribución de campaña SIEMPRE viene de la cookie capturada en el
  // primer request (proxy.ts), nunca de lo que el cliente mande en el
  // body — igual que precio/stock, no es un dato en el que el navegador
  // sea la fuente de verdad.
  const attribution = await getAttribution();
  const input = {
    ...parsed.data,
    source: attribution
      ? {
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmContent: attribution.utmContent,
          utmTerm: attribution.utmTerm,
          fbclid: attribution.fbclid,
          gclid: attribution.gclid,
          ttclid: attribution.ttclid,
          referrer: attribution.referrer,
        }
      : undefined,
  };

  try {
    const result = await createOrder(supabase, { cartId: cart.id, input, sessionId });
    return NextResponse.json(
      {
        orderNumber: result.orderNumber,
        publicAccessToken: result.publicAccessToken,
        whatsappLink: result.whatsappLink,
        whatsappMessage: result.whatsappMessage,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.code === "INSUFFICIENT_STOCK" ? 409 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    throw err;
  }
}
