import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  captureAttributionFromUrl,
  ATTRIBUTION_COOKIE_NAME,
  ATTRIBUTION_COOKIE_MAX_AGE,
} from "@/lib/attribution";

/**
 * Refresca la sesión de Supabase en cada request (patrón oficial de
 * `@supabase/ssr` para Next.js App Router), aplica el "gate" grueso de
 * autenticación para `/admin/*`, y captura first-touch attribution
 * (sección 32/41 del plan) en una cookie propia.
 *
 * Esto es la capa 1 de las 3 capas de autorización del proyecto (UI/API/DB):
 * aquí solo se decide "¿hay una sesión válida?". La decisión fina de
 * "¿este rol puede ver esta pantalla/hacer esta acción?" vive en el layout
 * del admin y en cada Route Handler — nunca solo aquí, y nunca solo en el
 * frontend.
 */
export async function updateSession(request: NextRequest) {
  // Se calcula una sola vez; se aplica al final sobre la respuesta que
  // efectivamente se devuelva (sea `next()` o un `redirect()`), para no
  // perderla si el resto de la función reconstruye la respuesta.
  const attributionValue = captureAttributionFromUrl(
    request.nextUrl,
    request.headers.get("referer"),
    request.cookies.get(ATTRIBUTION_COOKIE_NAME)?.value,
  );

  function withAttribution(res: NextResponse): NextResponse {
    if (attributionValue) {
      res.cookies.set(ATTRIBUTION_COOKIE_NAME, attributionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
      });
    }
    return res;
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // En Fase 0, antes de conectar Supabase, dejamos pasar la request tal
    // cual en vez de romper todo el sitio — pero /admin seguirá bloqueado
    // por el propio layout server-side, que sí exige la sesión.
    return withAttribution(response);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");

  if (isAdminRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return withAttribution(NextResponse.redirect(loginUrl));
  }

  if (isLoginRoute && user) {
    return withAttribution(NextResponse.redirect(new URL("/admin", request.url)));
  }

  return withAttribution(response);
}
