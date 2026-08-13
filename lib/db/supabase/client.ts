import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Client Components.
 *
 * Usa exclusivamente variables PÚBLICAS (`NEXT_PUBLIC_*`) — este archivo se
 * ejecuta en el navegador. Nunca importar aquí `SUPABASE_SERVICE_ROLE_KEY`.
 * La seguridad real de los datos la da RLS en Postgres (ver
 * `supabase/migrations/0012_row_level_security.sql`), no la ausencia de
 * este cliente en el navegador.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local (ver .env.example).",
    );
  }

  return createBrowserClient(url, anonKey);
}
