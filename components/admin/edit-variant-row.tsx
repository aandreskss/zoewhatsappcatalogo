"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Pencil } from "lucide-react";
import { InventoryCell } from "@/components/admin/inventory-cell";
import { uploadImage } from "@/lib/storage/upload";
import {
  updateVariantFieldsAction,
  updateOptionValueAction,
  addVariantImageAction,
  removeVariantImageAction,
} from "@/app/admin/(protected)/productos/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantImage {
  id: string;
  url: string;
}

interface OptionLabel {
  optionValueId: string;
  value: string;
}

interface Props {
  variant: {
    id: string;
    sku: string;
    priceUsd: number;
    compareAtPriceUsd: number | null;
    status: "active" | "inactive";
  };
  labels: OptionLabel[];
  variantImages: VariantImage[];
  stores: { id: string; name: string }[];
  inventoryByStore: Record<string, number>;
  productId: string;
}

// ---------------------------------------------------------------------------
// EditCell sub-component
// ---------------------------------------------------------------------------

interface EditCellProps {
  value: string;
  type?: "text" | "number";
  format?: (v: string) => string;
  onSave: (value: string) => Promise<string | null>;
}

function EditCell({ value, type = "text", format, onSave }: EditCellProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(current);
    setError(null);
    setEditing(true);
  }

  async function commit() {
    if (draft === current) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const err = await onSave(draft);
    setSaving(false);
    if (err) {
      setError(err);
      setCurrent(current); // revert display
      setEditing(false);
    } else {
      setCurrent(draft);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      setDraft(current);
      setEditing(false);
    }
  }

  const display = format ? format(current) : current;

  return (
    <div className={saving ? "opacity-40" : undefined}>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-[#7B1847]/30 bg-white px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B1847]/40"
        />
      ) : (
        <span
          className="group flex cursor-text items-center gap-1 rounded px-1 py-0.5 hover:bg-[#F4EFEc] transition-colors"
          onClick={startEdit}
        >
          {display}
          <Pencil size={10} className="shrink-0 text-[#29252A]/20 opacity-0 group-hover:opacity-100" />
        </span>
      )}
      {error && (
        <p className="mt-0.5 text-[10px] text-red-500">{error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditVariantRow
// ---------------------------------------------------------------------------

export function EditVariantRow({
  variant,
  labels,
  variantImages,
  stores,
  inventoryByStore,
  productId,
}: Props) {
  const [localStatus, setLocalStatus] = useState<"active" | "inactive">(variant.status);
  const [localImages, setLocalImages] = useState<VariantImage[]>(variantImages);
  const [uploading, setUploading] = useState(false);
  const [, startStatusTransition] = useTransition();
  const [, startRemoveTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleStatusToggle() {
    const next: "active" | "inactive" = localStatus === "active" ? "inactive" : "active";
    setLocalStatus(next);
    startStatusTransition(() => {
      void updateVariantFieldsAction(variant.id, productId, { status: next });
    });
  }

  function handleRemoveImage(imageId: string) {
    setLocalImages((prev) => prev.filter((img) => img.id !== imageId));
    startRemoveTransition(() => {
      void removeVariantImageAction(variant.id, imageId, productId);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    setUploading(true);
    try {
      const url = await uploadImage(file);
      const result = await addVariantImageAction(variant.id, productId, url, variant.sku);
      if (!result.error) {
        // We don't have the new image id from the action, so we use url as a temp key
        // The server will revalidate and provide the real id on next render
        // For optimistic UI, push a temporary entry
        setLocalImages((prev) => [...prev, { id: url, url }]);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <tr
      className={
        localStatus === "inactive"
          ? "opacity-50 border-t border-[#EBE4E1]"
          : "border-t border-[#EBE4E1]"
      }
    >
      {/* Column 1 — Variante (talla) */}
      <td className="p-3">
        {labels.length > 0 ? (
          <div className="flex flex-col gap-1">
            {labels.map((label) => (
              <EditCell
                key={label.optionValueId}
                value={label.value}
                onSave={(v) =>
                  updateOptionValueAction(label.optionValueId, productId, v).then(
                    (r) => r.error,
                  )
                }
              />
            ))}
          </div>
        ) : (
          <span className="text-[#29252A]/40">—</span>
        )}
      </td>

      {/* Column 2 — SKU */}
      <td className="p-3 text-[#29252A]/60">
        <EditCell
          value={variant.sku}
          onSave={(v) =>
            updateVariantFieldsAction(variant.id, productId, { sku: v }).then((r) => r.error)
          }
        />
      </td>

      {/* Column 3 — Precio */}
      <td className="p-3">
        <EditCell
          value={String(variant.priceUsd)}
          type="number"
          format={(v) => `$${parseFloat(v).toFixed(2)}`}
          onSave={(v) => {
            const n = parseFloat(v);
            if (isNaN(n) || n < 0) return Promise.resolve("Precio inválido");
            return updateVariantFieldsAction(variant.id, productId, { priceUsd: n }).then(
              (r) => r.error,
            );
          }}
        />
      </td>

      {/* Columns 4..N — Inventory per store */}
      {stores.map((store) => (
        <td key={store.id} className="p-3">
          <InventoryCell
            variantId={variant.id}
            storeId={store.id}
            productId={productId}
            initialQuantity={inventoryByStore[store.id] ?? 0}
          />
        </td>
      ))}

      {/* Column N+1 — Fotos */}
      <td className="p-3">
        <div className="flex items-center gap-1 flex-wrap">
          {localImages.map((img) => (
            <div key={img.id} className="relative group shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-7 w-7 rounded object-cover border border-[#EBE4E1]"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(img.id)}
                className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#29252A] text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                aria-label="Quitar foto"
              >
                ×
              </button>
            </div>
          ))}

          {localImages.length < 3 && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-dashed border-[#7B1847]/40 text-[#7B1847] hover:bg-[#F4EFEc] transition-colors text-xs disabled:opacity-40"
              aria-label="Agregar foto"
            >
              {uploading ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                "+"
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
        </div>
      </td>

      {/* Column N+2 — Estado */}
      <td className="p-3">
        <button
          type="button"
          onClick={handleStatusToggle}
          className={
            localStatus === "active"
              ? "rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 transition-colors"
              : "rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#F4EFEc] text-[#29252A]/40 transition-colors"
          }
        >
          {localStatus === "active" ? "Activo" : "Inactivo"}
        </button>
      </td>
    </tr>
  );
}
