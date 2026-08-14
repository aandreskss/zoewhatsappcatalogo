"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateStore,
  deleteStore,
  toggleStoreActive,
  toggleStorePickup,
  toggleStoreDelivery,
  type FormState,
} from "@/app/admin/(protected)/entrega/sucursales/actions";
import { Button } from "@/components/ui/button";
import { StoreFields } from "@/components/admin/store-fields";
import {
  Store,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  MessageCircle,
  Check,
  X,
  Package,
  Bike,
} from "lucide-react";

interface StoreRow {
  id: string;
  name: string;
  code: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  active: boolean;
}

const initialState: FormState = { error: null };

export function StoreCard({ store }: { store: StoreRow }) {
  const [editing, setEditing]           = useState(false);
  const [isPendingActive, startActive]  = useTransition();
  const [isPendingPickup, startPickup]  = useTransition();
  const [isPendingDelivery, startDelivery] = useTransition();
  const [isPendingDelete, startDelete]  = useTransition();

  const [editState, editAction, isPendingEdit] = useActionState(
    updateStore.bind(null, store.id),
    initialState,
  );

  const location = [store.address, store.city, store.state].filter(Boolean).join(", ");

  if (editing) {
    return (
      <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-white p-5 shadow-sm">
        <form
          action={async (fd) => {
            await editAction(fd);
            setEditing(false);
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold">Editar — {store.name}</p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X size={16} />
            </button>
          </div>

          <StoreFields defaults={store} disabled={isPendingEdit} />

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPendingEdit}>
              <Check size={14} />
              {isPendingEdit ? "Guardando…" : "Guardar cambios"}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancelar
            </button>
          </div>

          {editState.error && (
            <p className="text-sm text-[var(--color-error)]">{editState.error}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border bg-white p-5 transition-opacity ${!store.active ? "opacity-60" : ""} border-[var(--color-border)]`}>
      <div className="flex items-start gap-4">
        {/* Ícono con código */}
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
          <Store size={16} className="text-[var(--color-primary)]" />
          <span className="text-[9px] font-bold text-[var(--color-primary)]">{store.code}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--color-foreground)]">{store.name}</p>
            {!store.active && (
              <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
                Inactiva
              </span>
            )}
          </div>

          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
              <MapPin size={12} className="shrink-0" />
              {location}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]">
            {store.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} /> {store.phone}
              </span>
            )}
            {store.whatsapp && (
              <span className="flex items-center gap-1">
                <MessageCircle size={11} /> {store.whatsapp}
              </span>
            )}
            {store.google_maps_url && (
              <a
                href={store.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--color-primary)]"
              >
                Ver en Maps
              </a>
            )}
          </div>

          {/* Toggles de servicio */}
          <div className="mt-3 flex flex-wrap gap-3">
            <Toggle
              label="Retiro en tienda"
              icon={<Package size={12} />}
              active={store.pickup_enabled}
              pending={isPendingPickup}
              onToggle={() => startPickup(() => toggleStorePickup(store.id, !store.pickup_enabled))}
            />
            <Toggle
              label="Delivery"
              icon={<Bike size={12} />}
              active={store.delivery_enabled}
              pending={isPendingDelivery}
              onToggle={() => startDelivery(() => toggleStoreDelivery(store.id, !store.delivery_enabled))}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Toggle activo/inactivo */}
          <button
            type="button"
            onClick={() => startActive(() => toggleStoreActive(store.id, !store.active))}
            disabled={isPendingActive}
            title={store.active ? "Desactivar sucursal" : "Activar sucursal"}
            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
              store.active ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                store.active ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              disabled={isPendingDelete}
              onClick={() => {
                if (!confirm(`¿Eliminar "${store.name}"? Esta acción no se puede deshacer.`)) return;
                startDelete(() => deleteStore(store.id));
              }}
              className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  icon,
  active,
  pending,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        active
          ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-border)]"
      }`}
    >
      {icon}
      {label}
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--color-success)]" : "bg-[var(--color-muted-foreground)]/40"}`} />
    </button>
  );
}
