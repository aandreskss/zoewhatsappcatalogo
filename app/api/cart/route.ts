import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getCartSessionId, getOrCreateCartSessionId } from "@/lib/cart/session-cookie";
import { addItemToCart, getCartWithItems, CartError } from "@/lib/domain/cart";

export async function GET() {
  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return NextResponse.json({ items: [], cartId: null });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { cartId, items } = await getCartWithItems(supabase, sessionId);
  return NextResponse.json({ cartId, items });
}

const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const sessionId = await getOrCreateCartSessionId();
  const supabase = createSupabaseServiceRoleClient();

  try {
    await addItemToCart(supabase, sessionId, parsed.data.variantId, parsed.data.quantity);
  } catch (err) {
    if (err instanceof CartError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    throw err;
  }

  const { cartId, items } = await getCartWithItems(supabase, sessionId);
  return NextResponse.json({ cartId, items }, { status: 201 });
}
