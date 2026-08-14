import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/auth/session";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/db/supabase/server";
import { UserRoleEditor, type AssignedRole } from "@/components/admin/user-role-editor";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const currentUser = await getAdminSessionUser();
  if (!currentUser || !currentUser.roles.includes("super_admin")) {
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  const service = createSupabaseServiceRoleClient();

  // Fetch all auth users (email, last_sign_in_at, created_at)
  const {
    data: { users: authUsers },
  } = await service.auth.admin.listUsers({ perPage: 200 });

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, active");

  // Fetch all user_roles with role name + store name
  const { data: userRolesRaw } = await supabase
    .from("user_roles")
    .select("id, user_id, store_id, roles(id, name), stores(name)");

  // Fetch all roles (for the selector)
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name")
    .order("name");

  // Fetch active stores (for scope selection)
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, code")
    .eq("active", true)
    .order("name");

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // Group user_roles by user_id
  const rolesByUser = new Map<string, AssignedRole[]>();
  for (const ur of userRolesRaw ?? []) {
    const role = ur.roles as { id: string; name: string } | null;
    const store = ur.stores as { name: string } | null;
    if (!role) continue;
    const list = rolesByUser.get(ur.user_id) ?? [];
    list.push({
      id: ur.id,
      roleName: role.name,
      storeId: ur.store_id ?? null,
      storeName: store?.name ?? null,
    });
    rolesByUser.set(ur.user_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#29252A]">Usuarios del panel</h1>
        <p className="mt-0.5 text-sm text-[#29252A]/50">
          {authUsers.length} usuario{authUsers.length !== 1 ? "s" : ""} registrado{authUsers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Usuario
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 md:table-cell">
                Último acceso
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                Roles
              </th>
            </tr>
          </thead>
          <tbody>
            {authUsers.map((u) => {
              const profile = profileMap.get(u.id);
              const assignedRoles = rolesByUser.get(u.id) ?? [];
              const isSelf = u.id === currentUser.id;
              const initials = (u.email ?? "?").slice(0, 2).toUpperCase();
              const isActive = profile?.active !== false;

              return (
                <tr
                  key={u.id}
                  className="border-t border-[#EBE4E1] transition-colors hover:bg-[#F4EFEc]/40"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isActive ? "bg-[#C9748A]/15 text-[#C9748A]" : "bg-[#F4EFEc] text-[#29252A]/30"}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#29252A]">
                            {profile?.full_name ?? u.email}
                          </p>
                          {isSelf && (
                            <span className="rounded-full bg-[#F4EFEc] px-1.5 py-0.5 text-[10px] font-bold text-[#29252A]/40">
                              Tú
                            </span>
                          )}
                          {!isActive && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {profile?.full_name && (
                          <p className="text-xs text-[#29252A]/50">{u.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-xs text-[#29252A]/50 md:table-cell">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-4">
                    <UserRoleEditor
                      userId={u.id}
                      assignedRoles={assignedRoles}
                      availableRoles={roles ?? []}
                      stores={stores ?? []}
                      isSelf={isSelf}
                    />
                  </td>
                </tr>
              );
            })}

            {authUsers.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <div className="flex flex-col items-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
                      <Users size={20} className="text-[#29252A]/25" />
                    </div>
                    <p className="text-sm font-semibold text-[#29252A]">Sin usuarios registrados</p>
                    <p className="text-xs text-[#29252A]/45">
                      Los usuarios aparecerán aquí cuando se registren
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-[#EBE4E1] bg-[#F4EFEc] px-5 py-4">
        <p className="text-xs font-semibold text-[#29252A]/60">Roles disponibles</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { name: "super_admin", label: "Super Admin", desc: "Acceso total. Gestiona roles y configuración." },
            { name: "admin", label: "Admin", desc: "Gestiona pedidos, productos y clientes." },
            { name: "inventory", label: "Inventario", desc: "Solo acceso al catálogo e inventario." },
            { name: "sales", label: "Ventas", desc: "Solo pedidos y clientes." },
          ].map((r) => (
            <div key={r.name} className="rounded-xl border border-[#EBE4E1] bg-white p-3">
              <p className="text-xs font-bold text-[#29252A]">{r.label}</p>
              <p className="mt-0.5 text-[11px] text-[#29252A]/50">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#29252A]/40">
          Un usuario sin roles puede iniciar sesión pero no verá nada en el panel.
          Puedes asignar múltiples roles al mismo usuario.
          Si asignas un rol con sucursal específica, el usuario solo podrá gestionar esa sucursal.
        </p>
      </div>
    </div>
  );
}
