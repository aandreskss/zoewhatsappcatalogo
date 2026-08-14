"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionUser } from "@/lib/auth/session";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/db/supabase/server";

async function requireSuperAdmin() {
  const user = await getAdminSessionUser();
  if (!user || !user.roles.includes("super_admin")) {
    throw new Error("Solo el super administrador puede gestionar roles de usuarios.");
  }
  return user;
}

export async function assignRole(
  userId: string,
  roleName: string,
  storeId: string | null,
): Promise<{ error: string | null }> {
  try {
    await requireSuperAdmin();

    const supabase = await createSupabaseServerClient();

    // Look up role UUID by name
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .maybeSingle();

    if (!role) return { error: `El rol "${roleName}" no existe.` };

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: role.id,
      store_id: storeId ?? null,
    });

    if (error) {
      if (error.code === "23505") return { error: "Este usuario ya tiene ese rol asignado." };
      return { error: error.message };
    }

    revalidatePath("/admin/usuarios");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al asignar rol" };
  }
}

export async function removeRole(userRoleId: string): Promise<{ error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", userRoleId);

    if (error) return { error: error.message };

    revalidatePath("/admin/usuarios");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al eliminar rol" };
  }
}

export async function toggleUserActive(
  userId: string,
  active: boolean,
): Promise<{ error: string | null }> {
  try {
    await requireSuperAdmin();
    const service = createSupabaseServiceRoleClient();

    const { error } = await service
      .from("profiles")
      .update({ active })
      .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/admin/usuarios");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar usuario" };
  }
}
