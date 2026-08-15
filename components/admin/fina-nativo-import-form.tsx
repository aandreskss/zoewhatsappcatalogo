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
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FinaNativoImportResponse,
  FinaNativoRowResult,
} from "@/app/api/admin/import/fina-nativo/route";

interface Store {
  id: string;
  name: string;
  code: string;
}

interface Props {
  stores: Store[];
}

const ACCEPTED = ".csv,.xlsx,.xlsm,.xls";

export function FinaNativoImportForm({ stores }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinaNativoImportResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [createMissing, setCreateMissing] = useState(false);
  const [fallbackStoreId, setFallbackStoreId] = useState("");

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xlsm", "xls"].includes(ext ?? "")) {
      setError("El archivo debe ser CSV, XLSX, XLSM o XLS");
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
    if (!file) { setError("Selecciona un archivo"); return; }
    setError(null);
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("create_missing", String(createMissing));
    if (fallbackStoreId) form.append("fallback_store_id", fallbackStoreId);

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
    if (r.status === "created") return <PlusCircle size={13} className="text-[#7B1847] shrink-0" />;
    if (r.status === "not_found" || r.status === "skipped") return <AlertCircle size={13} className="text-amber-500 shrink-0" />;
    return <XCircle size={13} className="text-red-500 shrink-0" />;
  };

  const statusLabel = (r: FinaNativoRowResult) => {
    if (r.status === "updated") return "Actualizado";
    if (r.status === "created") return "Creado";
    if (r.status === "not_found") return "No encontrado";
    if (r.status === "skipped") return "Omitido";
    return "Error";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Format info */}
      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          Exporta desde <strong>Fina → Inventario → Exportar</strong>. Acepta{" "}
          <strong>CSV, XLSX, XLSM y XLS</strong>. Las columnas de sucursales
          (ej. <em>sede il duomo</em>, <em>av bolivar</em>) se detectan automáticamente por nombre.
        </p>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#29252A]">Archivo</p>
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
              dragging ? "border-[#7B1847] bg-[#7B1847]/5" : "border-[#EBE4E1] hover:border-[#7B1847]/40 hover:bg-[#F4EFEc]"
            }`}
          >
            <Upload size={20} className="text-[#7B1847]" />
            <p className="text-sm font-medium text-[#29252A]">Arrastra o haz clic para subir</p>
            <p className="text-xs text-[#29252A]/40">CSV · XLSX · XLSM · XLS</p>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
          className="hidden"
        />
      </div>

      {/* Fallback store selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#29252A]" htmlFor="fallback-store">
          Tienda destino
          <span className="ml-1.5 text-xs font-normal text-[#29252A]/40">
            (solo si el archivo no tiene columnas por sucursal)
          </span>
        </label>
        <select
          id="fallback-store"
          value={fallbackStoreId}
          onChange={(e) => setFallbackStoreId(e.target.value)}
          className="rounded-xl border border-[#EBE4E1] bg-white px-3 py-2 text-sm text-[#29252A] focus:outline-none focus:ring-2 focus:ring-[#7B1847]/30"
        >
          <option value="">Detectar automáticamente desde el archivo</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.code ? ` (${s.code})` : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-[#29252A]/40">
          Si el archivo tiene columnas por tienda, esta opción se ignora y se usan las del archivo.
        </p>
      </div>

      {/* Create missing toggle */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EBE4E1] bg-white px-4 py-3 transition-colors hover:border-[#7B1847]/30">
        <input
          type="checkbox"
          checked={createMissing}
          onChange={(e) => setCreateMissing(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#7B1847]"
        />
        <div>
          <p className="text-sm font-semibold text-[#29252A]">Crear productos que no existan</p>
          <p className="mt-0.5 text-xs text-[#29252A]/50">
            Si un producto del archivo no está en el catálogo de Zoe, se creará automáticamente en
            estado <strong>borrador</strong> con todas sus tallas y stock. Solo faltará agregar
            imágenes y precio de venta.
          </p>
        </div>
      </label>

      {createMissing && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800">
            Los productos nuevos se crearán con <strong>precio de venta $0</strong>. Actualiza el
            precio desde <strong>Admin → Productos</strong> antes de publicarlos. El costo se importa
            tal como está en Fina.
          </p>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-sm text-red-600">
          <XCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <Button type="button" onClick={handleImport} disabled={loading || !file} className="self-start">
        {loading ? "Importando…" : "Importar desde Fina"}
      </Button>

      {/* Post-import: detected stores */}
      {result && result.detectedStores.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-800">Tiendas asignadas</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {result.detectedStores.map((s) => (
              <li key={s} className="text-xs text-emerald-700">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.detectedStores.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-xs font-semibold text-amber-800">Sin tienda asignada</p>
          <p className="mt-0.5 text-xs text-amber-700">
            No se detectaron columnas de tienda en el archivo y no se seleccionó tienda de respaldo.
            El inventario no fue actualizado. Selecciona una tienda destino e importa nuevamente.
          </p>
        </div>
      )}

      {/* Summary */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Actualizados", value: result.updated, color: "text-emerald-600" },
              { label: "Creados", value: result.created, color: "text-[#7B1847]" },
              { label: "No encontrados", value: result.notFound, color: "text-amber-600" },
              { label: "Omitidos", value: result.skipped, color: "text-[#29252A]/40" },
              { label: "Errores", value: result.errors, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#EBE4E1] bg-white p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] leading-tight text-[#29252A]/50">{s.label}</p>
              </div>
            ))}
          </div>

          {result.notFound > 0 && !createMissing && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <p className="text-xs text-amber-800">
                <strong>{result.notFound}</strong> variante(s) no se encontraron en el catálogo.
                Activa <strong>"Crear productos que no existan"</strong> para importarlos automáticamente,
                o verifica que los SKUs sigan el formato <code className="rounded bg-amber-100 px-1">CODIGO-TALLA</code> (ej.{" "}
                <code className="rounded bg-amber-100 px-1">T1292R-37</code>).
              </p>
            </div>
          )}

          {result.created > 0 && (
            <div className="rounded-xl border border-[#F0D8E8] bg-[#FDF8FB] px-4 py-2.5">
              <p className="text-xs text-[#7B1847]">
                <strong>{result.created}</strong> variante(s) creadas en estado borrador. Ve a{" "}
                <strong>Admin → Productos</strong> para agregar imágenes y establecer el precio de venta.
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
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">SKU</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Tiendas</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className={`border-t border-[#EBE4E1] ${r.status === "created" ? "bg-[#FDF8FB]" : "bg-white"}`}>
                      <td className="px-3 py-2 font-medium text-[#29252A]">{r.item}</td>
                      <td className="px-3 py-2 text-[#29252A]/70">{r.size}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#29252A]/50">{r.candidateSku}</td>
                      <td className="px-3 py-2">
                        {r.storeResults && r.storeResults.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {r.storeResults.map((sr) => (
                              <span key={sr.storeName} className="text-[#29252A]/60">
                                {sr.storeName.split(" ").slice(0, 2).join(" ")}:{" "}
                                <span className="font-semibold text-[#29252A]">{sr.newQty}</span>
                                {sr.previousQty !== sr.newQty && sr.previousQty > 0 && (
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
                          <span className={r.status === "created" ? "font-semibold text-[#7B1847]" : ""}>
                            {statusLabel(r)}
                          </span>
                          {r.message && r.status === "not_found" && (
                            <span className="text-[#29252A]/30" title={r.message}>ⓘ</span>
                          )}
                          {r.message && r.status === "error" && (
                            <span className="text-red-500" title={r.message}>ⓘ</span>
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
