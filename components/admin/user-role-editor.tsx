"use client";

import { useTransition, useState } from "react";
import { X, Plus, Loader2, ChevronDown } from "lucide-react";
import { assignRole, removeRole } from "@/app/admin/(protected)/usuarios/actions";

export interface AssignedRole {
  id: string;
  roleName: string;
  storeId: string | null;
  storeName: string | null;
}

interface Role { id: string; name: string }
interface Store { id: string; name: string; code: string | null }

interface Props {
  userId: string;
  assignedRoles: AssignedRole[];
  availableRoles: Role[];
  stores: Store[];
  isSelf: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  inventory: "Inventario",
  sales: "Ventas",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-[#C9748A]/15 text-[#C9748A] border-[#C9748A]/20",
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  inventory: "bg-blue-100 text-blue-700 border-blue-200",
  sales: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function UserRoleEditor({ userId, assignedRoles, availableRoles, stores, isSelf }: Props) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState(availableRoles[0]?.name ?? "");
  const [selectedStore, setSelectedStore] = useState<string>(""); // "" = global
  const [error, setError] = useState<string | null>(null);

  function handleRemove(roleId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeRole(roleId);
      if (result.error) setError(result.error);
    });
  }

  function handleAssign() {
    setError(null);
    startTransition(async () => {
      const result = await assignRole(userId, selectedRole, selectedStore || null);
      if (result.error) {
        setError(result.error);
      } else {
        setAdding(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Current roles */}
      <div className="flex flex-wrap gap-1.5">
        {assignedRoles.length === 0 && (
          <span className="text-xs text-[#29252A]/40">Sin roles asignados</span>
        )}
        {assignedRoles.map((ar) => (
          <span
            key={ar.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_COLOR[ar.roleName] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
          >
            {ROLE_LABEL[ar.roleName] ?? ar.roleName}
            {ar.storeName && (
              <span className="opacity-60">· {ar.storeName}</span>
            )}
            {!isSelf && (
              <button
                onClick={() => handleRemove(ar.id)}
                disabled={pending}
                className="ml-0.5 rounded-full hover:opacity-70 transition-opacity disabled:opacity-30"
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Add role */}
      {!isSelf && (
        <>
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 self-start rounded-lg border border-dashed border-[#EBE4E1] px-2.5 py-1 text-xs text-[#29252A]/40 transition-colors hover:border-[#C9748A]/40 hover:text-[#C9748A]"
            >
              <Plus size={11} />
              Asignar rol
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Role select */}
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none rounded-lg border border-[#EBE4E1] bg-white py-1.5 pl-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9748A]/20"
                >
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {ROLE_LABEL[r.name] ?? r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#29252A]/40" />
              </div>

              {/* Store select */}
              {stores.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="appearance-none rounded-lg border border-[#EBE4E1] bg-white py-1.5 pl-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9748A]/20"
                  >
                    <option value="">Todas las sucursales</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.code ? ` (${s.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#29252A]/40" />
                </div>
              )}

              <button
                onClick={handleAssign}
                disabled={pending || !selectedRole}
                className="flex items-center gap-1.5 rounded-lg bg-[#C9748A] px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {pending ? <Loader2 size={11} className="animate-spin" /> : null}
                Guardar
              </button>
              <button
                onClick={() => { setAdding(false); setError(null); }}
                className="rounded-lg px-2 py-1.5 text-xs text-[#29252A]/50 hover:text-[#29252A] transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
