import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const CART_SESSION_COOKIE = "zoe_cart_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Identificador anónimo de carrito/favoritos, en una cookie httpOnly
 * propia (no reutiliza la cookie de sesión de Supabase Auth: el carrito
 * de un cliente anónimo no tiene nada que ver con el login del admin).
 * Se crea la primera vez que hace falta, nunca antes.
 */
export async function getOrCreateCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomUUID();
  cookieStore.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return sessionId;
}

export async function getCartSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE)?.value ?? null;
}
