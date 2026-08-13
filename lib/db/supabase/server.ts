import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route
 * Handlers, atado a la sesión (cookies) del usuario autenticado.
 *
 * Usa la clave ANON + RLS — es decir, respeta los permisos del usuario que
 * hace la petición. Para operaciones que deliberadamente necesitan saltarse
 * RLS (ej. crear un pedido ya validado, leer inventario para recalcular
 * disponibilidad), usar `createSupabaseServiceRoleClient` en su lugar, y
 * solo desde código de servidor que ya validó todo explícitamente.
 *
 * El import de `server-only` al inicio del archivo hace que el build
 * falle de inmediato si algún Client Component llega a importar este
 * módulo, en vez de descubrirlo en producción.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local (ver .env.example).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` puede llamarse desde un Server Component (no puede
          // escribir cookies). Es seguro ignorarlo cuando el middleware
          // (`middleware.ts`) ya se encarga de refrescar la sesión en cada
          // request.
        }
      },
    },
  });
}

/**
 * Cliente con la Service Role Key: ignora RLS por completo.
 *
 * SOLO se usa en Route Handlers/Server Actions que ya hicieron toda la
 * validación de negocio (precio, stock, rol) en el propio código de
 * servidor — nunca se expone a un componente que renderiza directamente
 * lo que este cliente devuelve sin filtrar.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Este cliente solo debe usarse en servidor.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
