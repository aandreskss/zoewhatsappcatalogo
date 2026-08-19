"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { setInventoryAction } from "@/app/admin/(protected)/productos/actions";

export function InventoryCell({
  variantId,
  storeId,
  productId,
  initialQuantity,
}: {
  variantId: string;
  storeId: string;
  productId: string;
  initialQuantity: number;
}) {
  const [value, setValue] = React.useState(initialQuantity);
  const [saving, setSaving] = React.useState(false);
  const [flash, setFlash] = React.useState<"ok" | "err" | null>(null);
  const savedQty = React.useRef(initialQuantity);
  const isDirty = value !== savedQty.current;

  async function save() {
    const qty = Math.max(0, Math.round(value));
    if (qty === savedQty.current) return;
    setSaving(true);
    try {
      await setInventoryAction(variantId, storeId, qty, productId);
      savedQty.current = qty;
      setValue(qty);
      setFlash("ok");
    } catch {
      setValue(savedQty.current);
      setFlash("err");
    } finally {
      setSaving(false);
      setTimeout(() => setFlash(null), 1500);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void save(); }
        }}
        title={flash === "err" ? "Error al guardar — valor revertido" : undefined}
        className={[
          "h-9 w-20 rounded-md border px-2 text-sm tabular-nums outline-none transition-all disabled:opacity-40",
          "focus:ring-2 focus:ring-[#C9748A]/25",
          flash === "ok" ? "border-emerald-400 bg-emerald-50" : "",
          flash === "err" ? "border-red-400 bg-red-50" : "",
          flash === null && isDirty ? "border-[#7B1847]/50 bg-[#FDF8FB]" : "",
          flash === null && !isDirty ? "border-[#EBE4E1] bg-white" : "",
        ].join(" ")}
      />
      {isDirty && !saving && flash === null && (
        <button
          type="button"
          onClick={() => void save()}
          title="Guardar cantidad"
          className="shrink-0 rounded p-1 text-[#7B1847] transition-colors hover:bg-[#F0D8E8]"
        >
          <Check size={12} />
        </button>
      )}
    </div>
  );
}
