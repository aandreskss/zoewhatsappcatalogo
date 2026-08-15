"use client";

import { useRef, useState } from "react";
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FinaNativoImportResponse,
  FinaNativoRowResult,
} from "@/app/api/admin/import/fina-nativo/route";

export function FinaNativoImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinaNativoImportResponse | null>(null);
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

    setError(null);
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/import/fina-nativo", { method: "POST", body: form });
      const json = (await res.json()) as FinaNativoImportResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setResult(json);
      setShowDetails(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = (r: FinaNativoRowResult) => {
    if (r.status === "updated") return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
    if (r.status === "not_found" || r.status === "skipped")
      return <AlertCircle size={13} className="text-amber-500 shrink-0" />;
    return <XCircle size={13} className="text-red-500 shrink-0" />;
  };

  const statusLabel = (r: FinaNativoRowResult) => {
    if (r.status === "updated") return "Actualizado";
    if (r.status === "not_found") return "No encontrado";
    if (r.status === "skipped") return "Omitido";
    return "Error";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Format info */}
      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-blue-800">Formato nativo de Fina</p>
          <p className="text-xs text-blue-700">
            Exporta directamente desde <strong>Fina → Inventario → Exportar CSV</strong>. El archivo
            debe tener columnas <code className="rounded bg-blue-100 px-1">Tipo</code>,{" "}
            <code className="rounded bg-blue-100 px-1">Nombre</code> y las columnas de sucursales
            como <code className="rounded bg-blue-100 px-1">sede il duomo</code> y{" "}
            <code className="rounded bg-blue-100 px-1">av bolivar</code>. Las tiendas se detectan
            automáticamente por nombre.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#29252A]">Archivo CSV de Fina</p>
        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#29252A]">{file.name}</p>
              <p className="text-xs text-[#29252A]/50">{(file.size / 1024).toFixed(1)} KB</p>
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
                ? "border-[#7B1847] bg-[#7B1847]/5"
                : "border-[#EBE4E1] hover:border-[#7B1847]/40 hover:bg-[#F4EFEc]"
            }`}
          >
            <Upload size={20} className="text-[#7B1847]" />
            <p className="text-sm font-medium text-[#29252A]">Arrastra o haz clic para subir</p>
            <p className="text-xs text-[#29252A]/40">
              Exportado desde Fina → Inventario → CSV
            </p>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) handleFile(f);
          }}
          className="hidden"
        />
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm text-red-600">
          <XCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <Button type="button" onClick={handleImport} disabled={loading || !file} className="self-start">
        {loading ? "Importando…" : "Importar inventario Fina"}
      </Button>

      {/* Detected stores banner */}
      {result && result.detectedStores.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-800">Tiendas detectadas en el CSV</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {result.detectedStores.map((s) => (
              <li key={s} className="text-xs text-emerald-700">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && result.detectedStores.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-xs font-semibold text-amber-800">
            No se detectaron columnas de tiendas en el CSV
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Asegúrate de que las columnas del CSV coincidan con los nombres de tus sucursales activas
            en Zoe.
          </p>
        </div>
      )}

      {/* Summary */}
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

          {result.notFound > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <p className="text-xs text-amber-800">
                <strong>{result.notFound}</strong> variante(s) no encontradas en el catálogo de Zoe.
                Revisa que el SKU del producto en Zoe siga el formato{" "}
                <code className="rounded bg-amber-100 px-1">CODIGO-TALLA</code> (ej.{" "}
                <code className="rounded bg-amber-100 px-1">T1292R-37</code>).
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 self-start text-xs text-[#29252A]/50 underline"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDetails ? "Ocultar detalle" : `Ver detalle (${result.total} variantes)`}
          </button>

          {showDetails && (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-[#EBE4E1]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#F4EFEc]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Producto</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Talla</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">SKU buscado</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Tiendas</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className="border-t border-[#EBE4E1] bg-white">
                      <td className="px-3 py-2 font-medium text-[#29252A]">{r.item}</td>
                      <td className="px-3 py-2 text-[#29252A]/70">{r.size}</td>
                      <td className="px-3 py-2 font-mono text-[#29252A]/50">{r.candidateSku}</td>
                      <td className="px-3 py-2">
                        {r.storeResults && r.storeResults.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {r.storeResults.map((sr) => (
                              <span key={sr.storeName} className="text-[#29252A]/60">
                                {sr.storeName.split(" ").slice(0, 2).join(" ")}:{" "}
                                <span className="font-semibold text-[#29252A]">{sr.newQty}</span>
                                {sr.previousQty !== sr.newQty && (
                                  <span className="text-[#29252A]/40"> (antes {sr.previousQty})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#29252A]/30">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1">
                          {statusIcon(r)}
                          <span>{statusLabel(r)}</span>
                          {r.message && (
                            <span className="text-[#29252A]/40" title={r.message}>
                              ⓘ
                            </span>
                          )}
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
