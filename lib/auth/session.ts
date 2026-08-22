import "server-only";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/db/supabase/server";

export type AppRole = "super_admin" | "admin" | "inventory" | "sales";

export interface AdminSessionUser {
  id: string;
  email: string | null;
  fullName: string | null;
  roles: AppRole[];
  /** Si está limitado a una sucursal (ver `user_roles.store_id`), null = todas. */
  storeId: string | null;
}

/**
 * Capa 2 de las 3 capas de autorización (UI/API/DB): resuelve quién es el
 * usuario autenticado y con qué rol(es) — nunca confiar en un rol que venga
 * del cliente (header, query param, body del request).
 *
 * Devuelve `null` si no hay sesión. Cada Server Component/Route Handler del
 * admin debe llamar a esto (o a `requireRole`) y decidir explícitamente qué
 * hacer si es `null` o si el rol no alcanza — no basta con que el
 * middleware haya dejado pasar la request.
 */
export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const service = createSupabaseServiceRoleClient();
  const { data: roleRows } = await service
    .from("user_roles")
    .select("store_id, roles(name)")
    .eq("user_id", user.id);

  const roles = (roleRows ?? [])
    .map((row) => (row.roles as unknown as { name: AppRole } | null)?.name)
    .filter((name): name is AppRole => Boolean(name));

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    roles,
    storeId: roleRows?.[0]?.store_id ?? null,
  };
}

/**
 * Exige que haya sesión y, opcionalmente, que el usuario tenga al menos uno
 * de los roles indicados. Lanza si no se cumple — usarlo al inicio de
 * páginas/Route Handlers sensibles del admin en vez de reimplementar la
 * comprobación en cada uno.
 */
export async function requireAdminUser(
  allowedRoles?: AppRole[],
): Promise<AdminSessionUser> {
  const user = await getAdminSessionUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (allowedRoles && !user.roles.some((role) => allowedRoles.includes(role))) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
