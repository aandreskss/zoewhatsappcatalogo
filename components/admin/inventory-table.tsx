"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, History, X, AlertCircle, Check, Trash2 } from "lucide-react";
import {
  updateInventoryAction,
  updateCostAction,
  updateVariantPriceAction,
  getMovementsAction,
  deleteVariantAction,
  deleteProductFromInventoryAction,
} from "@/app/admin/(protected)/inventario/actions";

export interface VariantRow {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  barcode: string | null;
  priceUsd: number;
  costUsd: number | null;
  stockByStore: Record<string, number>;
  totalStock: number;
}

interface Store {
  id: string;
  name: string;
  code: string | null;
}

// ── Inline stock cell ──────────────────────────────────────────────────────────
function StockCell({
  variantId,
  storeId,
  initialQty,
  onSaved,
}: {
  variantId: string;
  storeId: string;
  initialQty: number;
  onSaved?: (qty: number) => void;
}) {
  const [value, setValue] = useState(initialQty);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);
  const savedQty = useRef(initialQty);
  const isDirty = value !== savedQty.current;

  async function save() {
    const qty = Math.max(0, Math.round(value));
    if (qty === savedQty.current) return;
    setSaving(true);
    const result = await updateInventoryAction(variantId, storeId, qty);
    setSaving(false);
    if (result.error) {
      setValue(savedQty.current);
      setFlash("err");
    } else {
      savedQty.current = qty;
      setFlash("ok");
      onSaved?.(qty);
    }
    setTimeout(() => setFlash(null), 1500);
  }

  async function handleBlur() {
    if (!isDirty) return;
    await save();
  }

  const isZero = value === 0;

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } }}
        disabled={saving}
        title={flash === "err" ? "Error al guardar" : undefined}
        className={`w-14 rounded-lg border px-2 py-1 text-center text-sm tabular-nums outline-none transition-all disabled:opacity-40
          focus:ring-2 focus:ring-[#C9748A]/25
          ${flash === "ok" ? "border-emerald-400 bg-emerald-50" : ""}
          ${flash === "err" ? "border-red-400 bg-red-50" : ""}
          ${flash === null && isDirty ? "border-[#7B1847]/50 bg-[#FDF8FB]" : ""}
          ${flash === null && !isDirty && isZero ? "border-red-200 bg-red-50 text-red-600" : ""}
          ${flash === null && !isDirty && !isZero ? "border-[#EBE4E1] bg-white text-[#29252A] hover:border-[#C9748A]/40" : ""}
        `}
      />
      {isDirty && !saving && flash === null && (
        <button
          type="button"
          onClick={save}
          title="Guardar cantidad"
          className="shrink-0 rounded-lg p-1 text-[#7B1847] transition-colors hover:bg-[#F0D8E8]"
        >
          <Check size={12} />
        </button>
      )}
    </div>
  );
}

// ── Inline cost cell ───────────────────────────────────────────────────────────
function CostCell({
  variantId,
  initialCost,
}: {
  variantId: string;
  initialCost: number | null;
}) {
  const [raw, setRaw] = useState(initialCost !== null ? String(initialCost) : "");
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    const parsed = raw.trim() === "" ? null : Number(raw);
    if (parsed === initialCost) return;
    setSaving(true);
    await updateCostAction(variantId, parsed);
    setSaving(false);
  }

  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={handleBlur}
      disabled={saving}
      placeholder="—"
      className="w-20 rounded-lg border border-[#EBE4E1] bg-white px-2 py-1 text-right text-sm tabular-nums outline-none transition-colors hover:border-[#C9748A]/40 focus:ring-2 focus:ring-[#C9748A]/25 disabled:opacity-40 placeholder:text-[#29252A]/30"
    />
  );
}

// ── Inline price cell ─────────────────────────────────────────────────────────
function PriceCell({
  variantId,
  initialPrice,
}: {
  variantId: string;
  initialPrice: number;
}) {
  const [raw, setRaw] = useState(String(initialPrice));
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    if (parsed === initialPrice || isNaN(parsed)) return;
    setSaving(true);
    await updateVariantPriceAction(variantId, parsed);
    setSaving(false);
  }

  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={handleBlur}
      disabled={saving}
      className="w-20 rounded-lg border border-[#EBE4E1] bg-white px-2 py-1 text-right text-sm tabular-nums outline-none transition-colors hover:border-[#C9748A]/40 focus:ring-2 focus:ring-[#C9748A]/25 disabled:opacity-40"
    />
  );
}

// ── Margin helper ─────────────────────────────────────────────────────────────
function calcMargin(priceUsd: number, costUsd: number | null) {
  if (costUsd === null || priceUsd <= 0) return null;
  const profit = priceUsd - costUsd;
  const pct = (profit / priceUsd) * 100;
  return { profit, pct };
}

function MarginBadge({ priceUsd, costUsd }: { priceUsd: number; costUsd: number | null }) {
  const m = calcMargin(priceUsd, costUsd);
  if (!m) return <span className="text-xs text-[#29252A]/25">—</span>;

  const color =
    m.pct >= 30
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : m.pct >= 15
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`inline-flex flex-col items-end rounded-lg border px-2 py-1 tabular-nums ${color}`}>
      <span className="text-xs font-semibold leading-tight">
        {m.profit >= 0 ? "+" : ""}${Math.abs(m.profit).toFixed(2)}
      </span>
      <span className="text-[10px] leading-tight opacity-75">{m.pct.toFixed(1)}%</span>
    </div>
  );
}

// ── Movements modal ────────────────────────────────────────────────────────────
type Movement = {
  id: string;
  type: string;
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  created_at: string;
  stores: { name: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  transferencia: "Transferencia",
  venta: "Venta",
  liberacion: "Liberación",
};

const TYPE_COLOR: Record<string, string> = {
  entrada: "bg-emerald-100 text-emerald-700",
  salida: "bg-red-100 text-red-700",
  ajuste: "bg-blue-100 text-blue-700",
  transferencia: "bg-violet-100 text-violet-700",
  venta: "bg-amber-100 text-amber-700",
  liberacion: "bg-gray-100 text-gray-600",
};

function MovementsModal({
  variantId,
  label,
  onClose,
}: {
  variantId: string;
  label: string;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMovementsAction(variantId).then(({ data, error: err }) => {
      if (err) setError(err);
      else setMovements(data as Movement[]);
    });
  }, [variantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-[#EBE4E1] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EBE4E1] px-5 py-4">
          <div>
            <p className="font-semibold text-[#29252A]">Historial de movimientos</p>
            <p className="text-xs text-[#29252A]/50">{label}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#29252A]/40 transition-colors hover:bg-[#F4EFEc] hover:text-[#29252A]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {!movements && !error && (
            <div className="flex justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C9748A] border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 py-10">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {movements && movements.length === 0 && (
            <p className="py-10 text-center text-sm text-[#29252A]/40">Sin movimientos registrados</p>
          )}
          {movements && movements.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Fecha</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Tipo</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Sucursal</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Δ</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Antes → Después</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t border-[#EBE4E1] transition-colors hover:bg-[#F4EFEc]/50">
                    <td className="px-4 py-2.5 text-xs text-[#29252A]/60">
                      {new Date(m.created_at).toLocaleDateString("es-VE", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLOR[m.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#29252A]/60">{m.stores?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold">
                      <span className={m.quantity_delta >= 0 ? "text-emerald-700" : "text-red-600"}>
                        {m.quantity_delta >= 0 ? "+" : ""}{m.quantity_delta}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-[#29252A]/50">
                      {m.previous_quantity} → {m.new_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────
export function InventoryTable({
  rows,
  stores,
}: {
  rows: VariantRow[];
  stores: Store[];
}) {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalVariant, setModalVariant] = useState<{ variantId: string; label: string } | null>(null);

  // Live stock overrides so the Total column updates without a page reload
  const [stockOverrides, setStockOverrides] = useState<Map<string, number>>(new Map());

  // Variant-level delete
  const [confirmDeleteVariantId, setConfirmDeleteVariantId] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [deletedVariantIds, setDeletedVariantIds] = useState<Set<string>>(new Set());

  // Product-level delete
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletedProductIds, setDeletedProductIds] = useState<Set<string>>(new Set());

  function handleStockSaved(variantId: string, storeId: string, newQty: number) {
    setStockOverrides((prev) => {
      const next = new Map(prev);
      next.set(`${variantId}:${storeId}`, newQty);
      return next;
    });
  }

  function getRowTotal(row: VariantRow): number {
    let total = 0;
    for (const store of stores) {
      const key = `${row.variantId}:${store.id}`;
      total += stockOverrides.has(key) ? stockOverrides.get(key)! : (row.stockByStore[store.id] ?? 0);
    }
    return total;
  }

  async function handleDeleteVariant(variantId: string) {
    setDeletingVariantId(variantId);
    const result = await deleteVariantAction(variantId);
    setDeletingVariantId(null);
    setConfirmDeleteVariantId(null);
    if (!result.error) setDeletedVariantIds((prev) => new Set(prev).add(variantId));
  }

  async function handleDeleteProduct(productId: string) {
    setDeletingProductId(productId);
    const result = await deleteProductFromInventoryAction(productId);
    setDeletingProductId(null);
    setConfirmDeleteProductId(null);
    if (!result.error) setDeletedProductIds((prev) => new Set(prev).add(productId));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (deletedVariantIds.has(r.variantId)) return false;
      if (deletedProductIds.has(r.productId)) return false;
      if (lowStockOnly && r.totalStock > 0) return false;
      if (!q) return true;
      return (
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.barcode ?? "").toLowerCase().includes(q) ||
        r.variantLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, search, lowStockOnly, deletedVariantIds, deletedProductIds]);

  // Group variants by product preserving insertion order
  const groupedFiltered = useMemo(() => {
    const groups = new Map<string, { productId: string; productName: string; variants: VariantRow[] }>();
    for (const row of filtered) {
      const g = groups.get(row.productId);
      if (g) {
        g.variants.push(row);
      } else {
        groups.set(row.productId, { productId: row.productId, productName: row.productName, variants: [row] });
      }
    }
    return Array.from(groups.values());
  }, [filtered]);

  const lowStockCount = rows.filter((r) => r.totalStock === 0).length;

  // Total columns: Talla + SKU + Código(hidden) + Precio + Costo + Ganancia + stores + Total + Actions
  const totalCols = 8 + stores.length;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#29252A]/35" />
          <input
            type="search"
            placeholder="Buscar por producto, SKU o código de barras…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#EBE4E1] bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9748A]/25 hover:border-[#C9748A]/30"
          />
        </div>
        <button
          onClick={() => setLowStockOnly((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
            lowStockOnly
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-red-200 hover:text-red-600"
          }`}
        >
          <AlertCircle size={14} />
          Stock en cero
          {lowStockCount > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${lowStockOnly ? "bg-red-200 text-red-800" : "bg-red-100 text-red-600"}`}>
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Talla / Variante</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">SKU</th>
                <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 lg:table-cell">Código</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Precio $</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Costo $</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Ganancia</th>
                {stores.map((s) => (
                  <th key={s.id} className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
                    {s.code ?? s.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {groupedFiltered.map((group) => {
                const groupTotal = group.variants.reduce((sum, v) => sum + getRowTotal(v), 0);
                const groupIsZero = groupTotal === 0;
                const isDeletingThisProduct = deletingProductId === group.productId;
                const isConfirmingThisProduct = confirmDeleteProductId === group.productId;

                const withCost = group.variants.filter((v) => v.costUsd !== null);
                const avgMargin =
                  withCost.length > 0
                    ? withCost.reduce((sum, v) => {
                        const m = calcMargin(v.priceUsd, v.costUsd);
                        return sum + (m?.pct ?? 0);
                      }, 0) / withCost.length
                    : null;
                const avgMarginColor =
                  avgMargin === null
                    ? ""
                    : avgMargin >= 30
                    ? "bg-emerald-100 text-emerald-700"
                    : avgMargin >= 15
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700";

                return (
                  <>
                    {/* ── Product header row ────────────────────────────────── */}
                    <tr key={`product-${group.productId}`} className="border-t-2 border-[#EBE4E1] bg-[#F4EFEc]/70">
                      <td colSpan={totalCols - 1} className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#29252A]">{group.productName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                            groupIsZero ? "bg-red-100 text-red-700" : groupTotal <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {groupTotal} en stock
                          </span>
                          <span className="text-xs text-[#29252A]/40">
                            {group.variants.length} talla{group.variants.length !== 1 ? "s" : ""}
                          </span>
                          {avgMargin !== null && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${avgMarginColor}`}>
                              ~{avgMargin.toFixed(0)}% margen
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isConfirmingThisProduct ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs font-medium text-red-600">¿Eliminar producto?</span>
                            <button
                              onClick={() => handleDeleteProduct(group.productId)}
                              disabled={isDeletingThisProduct}
                              className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              {isDeletingThisProduct ? "…" : "Sí"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteProductId(null)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-[#29252A]/60 transition-colors hover:bg-[#EBE4E1]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteProductId(group.productId)}
                            title="Eliminar producto"
                            className="rounded-lg p-1.5 text-[#29252A]/30 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* ── Variant rows ──────────────────────────────────────── */}
                    {group.variants.map((row) => {
                      const rowTotal = getRowTotal(row);
                      const isZero = rowTotal === 0;
                      const isConfirmingVariant = confirmDeleteVariantId === row.variantId;
                      const isDeletingVariant = deletingVariantId === row.variantId;

                      return (
                        <tr
                          key={row.variantId}
                          className={`border-t border-[#EBE4E1] transition-colors ${
                            isZero ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-[#F4EFEc]/40"
                          }`}
                        >
                          {/* Variant label */}
                          <td className="py-2.5 pl-8 pr-4">
                            <p className="font-medium text-[#29252A]">{row.variantLabel}</p>
                          </td>

                          {/* SKU */}
                          <td className="px-4 py-2.5 font-mono text-xs text-[#29252A]/60">{row.sku}</td>

                          {/* Barcode */}
                          <td className="hidden px-4 py-2.5 font-mono text-xs text-[#29252A]/40 lg:table-cell">{row.barcode ?? "—"}</td>

                          {/* Price */}
                          <td className="px-4 py-2.5 text-right">
                            <PriceCell variantId={row.variantId} initialPrice={row.priceUsd} />
                          </td>

                          {/* Cost */}
                          <td className="px-4 py-2.5 text-right">
                            <CostCell variantId={row.variantId} initialCost={row.costUsd} />
                          </td>

                          {/* Margin */}
                          <td className="px-4 py-2.5 text-right">
                            <MarginBadge priceUsd={row.priceUsd} costUsd={row.costUsd} />
                          </td>

                          {/* Stock per store */}
                          {stores.map((s) => (
                            <td key={s.id} className="px-4 py-2.5 text-center">
                              <StockCell
                                variantId={row.variantId}
                                storeId={s.id}
                                initialQty={row.stockByStore[s.id] ?? 0}
                                onSaved={(qty) => handleStockSaved(row.variantId, s.id, qty)}
                              />
                            </td>
                          ))}

                          {/* Row total */}
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-sm font-bold tabular-nums ${
                              isZero ? "bg-red-100 text-red-700" : rowTotal <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {rowTotal}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2.5 text-right">
                            {isConfirmingVariant ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs font-medium text-red-600">¿Eliminar?</span>
                                <button
                                  onClick={() => handleDeleteVariant(row.variantId)}
                                  disabled={isDeletingVariant}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                >
                                  {isDeletingVariant ? "…" : "Sí"}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteVariantId(null)}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#29252A]/60 transition-colors hover:bg-[#EBE4E1]"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-0.5">
                                <button
                                  onClick={() => setModalVariant({ variantId: row.variantId, label: `${row.productName} · ${row.variantLabel}` })}
                                  title="Ver historial"
                                  className="rounded-lg p-1.5 text-[#29252A]/30 transition-colors hover:bg-[#F4EFEc] hover:text-[#C9748A]"
                                >
                                  <History size={14} />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteVariantId(row.variantId)}
                                  title="Desactivar talla"
                                  className="rounded-lg p-1.5 text-[#29252A]/30 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}

              {groupedFiltered.length === 0 && (
                <tr>
                  <td colSpan={totalCols}>
                    <p className="py-10 text-center text-sm text-[#29252A]/40">
                      {search || lowStockOnly ? "Sin resultados para el filtro aplicado" : "Sin variantes de producto"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {groupedFiltered.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#EBE4E1] px-4 py-2.5 text-xs text-[#29252A]/40">
            <span>
              {groupedFiltered.length} producto{groupedFiltered.length !== 1 ? "s" : ""} ·{" "}
              {filtered.length} variante{filtered.length !== 1 ? "s" : ""}
              {filtered.length < rows.length && ` (de ${rows.length})`}
            </span>
            <span>
              Total en stock:{" "}
              <span className="font-semibold text-[#29252A]/70">
                {filtered.reduce((s, r) => s + getRowTotal(r), 0).toLocaleString("es-VE")}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Movements modal */}
      {modalVariant && (
        <MovementsModal
          variantId={modalVariant.variantId}
          label={modalVariant.label}
          onClose={() => setModalVariant(null)}
        />
      )}
    </>
  );
}
