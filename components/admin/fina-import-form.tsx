"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportResponse, ImportRowResult } from "@/app/api/admin/import/inventario/route";

interface Store {
  id: string;
  name: string;
  code: string | null;
}

interface Props {
  stores: Store[];
}

export function FinaImportForm({ stores }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError("El archivo debe ser un CSV (.csv)");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleImport() {
    if (!file) { setError("Selecciona un archivo CSV"); return; }
    if (mode === "single" && !storeId) { setError("Selecciona una sucursal"); return; }

    setError(null);
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    if (mode === "single") form.append("store_id", storeId);

    try {
      const res = await fetch("/api/admin/import/inventario", { method: "POST", body: form });
      const json = await res.json() as ImportResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setResult(json);
      setShowDetails(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = (r: ImportRowResult) => {
    if (r.status === "updated") return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
    if (r.status === "not_found" || r.status === "skipped") return <AlertCircle size={13} className="text-amber-500 shrink-0" />;
    return <XCircle size={13} className="text-red-500 shrink-0" />;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[#29252A]">Modalidad de inventario</p>
        <div className="grid grid-cols-2 gap-3">
          {(["single", "multi"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                mode === m
                  ? "border-[#C9748A] bg-[#C9748A]/5"
                  : "border-[#EBE4E1] hover:border-[#C9748A]/40"
              }`}
            >
              <p className={`text-sm font-semibold ${mode === m ? "text-[#C9748A]" : "text-[#29252A]"}`}>
                {m === "single" ? "Un solo almacén" : "Por sucursal"}
              </p>
              <p className="mt-0.5 text-xs text-[#29252A]/50">
                {m === "single"
                  ? "Todo el inventario va a una tienda"
                  : "El CSV incluye la columna "tienda""}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Store selector (single mode only) */}
      {mode === "single" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#29252A]" htmlFor="import-store">
            Sucursal / Almacén destino
          </label>
          <select
            id="import-store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="rounded-xl border border-[#EBE4E1] bg-white px-3 py-2 text-sm text-[#29252A] focus:outline-none focus:ring-2 focus:ring-[#C9748A]/30"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.code ? ` (${s.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Multi mode hint */}
      {mode === "multi" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-800">Formato requerido del CSV (modo multi-sucursal)</p>
          <code className="mt-1.5 block rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">
            sku,tienda,cantidad<br />
            ZOE-NEG-38,LME,15<br />
            ZOE-ROJ-39,AV5,8
          </code>
          <p className="mt-2 text-xs text-amber-700">
            La columna <strong>tienda</strong> debe contener el código de la sucursal (ej: LME, AV5).
          </p>
        </div>
      )}

      {/* CSV upload */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#29252A]">Archivo CSV de Fina</p>
        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#29252A]">{file.name}</p>
              <p className="text-xs text-[#29252A]/50">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setResult(null); }}
              className="text-xs text-[#29252A]/40 underline hover:text-[#29252A]/70"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus:outline-none ${
              dragging
                ? "border-[#C9748A] bg-[#C9748A]/5"
                : "border-[#EBE4E1] hover:border-[#C9748A]/40 hover:bg-[#F4EFEc]"
            }`}
          >
            <Upload size={20} className="text-[#C9748A]" />
            <p className="text-sm font-medium text-[#29252A]">Arrastra o haz clic para subir el CSV</p>
            <p className="text-xs text-[#29252A]/40">Exporta desde Fina → Productos → Inventario → CSV</p>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
          className="hidden"
        />
      </div>

      {/* Format hint */}
      <div className="rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
        <p className="text-xs font-medium text-[#29252A]/70">
          Formato esperado del CSV{mode === "single" ? " (modo almacén único)" : ""}
        </p>
        <code className="mt-1.5 block rounded-lg bg-white px-3 py-2 text-xs text-[#29252A]">
          {mode === "single"
            ? "sku,cantidad,precio_costo,precio_venta\nZOE-NEG-38,15,12.50,29.99"
            : "sku,tienda,cantidad,precio_costo,precio_venta\nZOE-NEG-38,LME,15,12.50,29.99"}
        </code>
        <p className="mt-1.5 text-xs text-[#29252A]/50">
          precio_costo y precio_venta son opcionales. El SKU debe coincidir exactamente con el catálogo.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm text-red-600">
          <XCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={handleImport}
        disabled={loading || !file}
        className="self-start"
      >
        {loading ? "Importando…" : "Importar inventario"}
      </Button>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Actualizados", value: result.updated, color: "text-emerald-600" },
              { label: "No encontrados", value: result.notFound, color: "text-amber-600" },
              { label: "Omitidos", value: result.skipped, color: "text-[#29252A]/50" },
              { label: "Errores", value: result.errors, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#EBE4E1] bg-white p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#29252A]/50">{s.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 self-start text-xs text-[#29252A]/50 underline"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDetails ? "Ocultar detalle" : `Ver detalle (${result.total} filas)`}
          </button>

          {showDetails && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-[#EBE4E1]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#F4EFEc]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">SKU</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Antes</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Después</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className="border-t border-[#EBE4E1] bg-white">
                      <td className="px-3 py-2 font-mono">{r.sku}</td>
                      <td className="px-3 py-2 text-[#29252A]/50">{r.previousQuantity ?? "—"}</td>
                      <td className="px-3 py-2 font-semibold">{r.newQuantity ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1">
                          {statusIcon(r)}
                          {r.message ?? (r.status === "updated" ? "Actualizado" : r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
