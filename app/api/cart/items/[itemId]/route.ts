import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getCartSessionId } from "@/lib/cart/session-cookie";
import {
  updateCartItemQuantity,
  removeCartItem,
  CartError,
  getCartWithItems,
} from "@/lib/domain/cart";

const updateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(20) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "No hay carrito activo" }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  try {
    await updateCartItemQuantity(supabase, sessionId, itemId, parsed.data.quantity);
  } catch (err) {
    if (err instanceof CartError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 404 });
    }
    throw err;
  }

  const { cartId, items } = await getCartWithItems(supabase, sessionId);
  return NextResponse.json({ cartId, items });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "No hay carrito activo" }, { status: 404 });
  }

  const supabase = createSupabaseServiceRoleClient();
  await removeCartItem(supabase, sessionId, itemId);

  const { cartId, items } = await getCartWithItems(supabase, sessionId);
  return NextResponse.json({ cartId, items });
}
