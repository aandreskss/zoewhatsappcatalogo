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
  Store,
  ExternalLink,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FinaNativoImportResponse,
  FinaNativoRowResult,
} from "@/app/api/admin/import/fina-nativo/route";
import type { FinaNativoPreviewResponse } from "@/app/api/admin/import/fina-nativo/preview/route";
import type { ColumnRole, ColumnRoleField } from "@/lib/domain/fina-nativo-helpers";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  stores: StoreOption[];
}

type Step = "idle" | "parsing" | "mapping" | "importing" | "done";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED = ".csv,.xlsx,.xlsm,.xls";

const FIELD_LABELS: Record<ColumnRoleField, string> = {
  tipo: "Tipo (ítem / variación)",
  nombre: "Nombre del artículo",
  sku: "SKU",
  categoria: "Categoría",
  costo_unitario: "Costo unitario",
  valor_inventario: "Valor en inventario",
  cantidad: "Cantidad total",
  sin_ubicacion: "Sin ubicación (ignorar)",
  cualquiera: "Cualquiera (ignorar)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function roleToSelectValue(role: ColumnRole): string {
  if (role.type === "ignore") return "ignore";
  if (role.type === "field") return `field:${role.field}`;
  return `store:${role.storeId}`;
}

function selectValueToRole(value: string, stores: StoreOption[]): ColumnRole {
  if (value === "ignore") return { type: "ignore" };
  if (value.startsWith("field:")) {
    return { type: "field", field: value.slice(6) as ColumnRoleField };
  }
  if (value.startsWith("store:")) {
    const storeId = value.slice(6);
    const store = stores.find((s) => s.id === storeId);
    return { type: "store", storeId, storeName: store?.name ?? "" };
  }
  return { type: "ignore" };
}

function roleSummary(role: ColumnRole): { label: string; color: string } {
  if (role.type === "ignore") return { label: "Ignorar", color: "text-[#29252A]/30" };
  if (role.type === "store") return { label: role.storeName, color: "text-emerald-600" };
  return { label: FIELD_LABELS[role.field], color: "text-[#7B1847]" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FinaNativoImportForm({ stores }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapping step state
  const [previewData, setPreviewData] = useState<FinaNativoPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, ColumnRole>>({});

  // Results step state
  const [result, setResult] = useState<FinaNativoImportResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ── File handling ───────────────────────────────────────────────────────────

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "xlsm", "xls"].includes(ext)) {
      setError("Formato no soportado. Usa CSV, XLSX, XLSM o XLS.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    triggerPreview(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  // ── Step: parsing ───────────────────────────────────────────────────────────

  async function triggerPreview(f: File) {
    setStep("parsing");
    setError(null);

    const form = new FormData();
    form.append("file", f);

    try {
      const res = await fetch("/api/admin/import/fina-nativo/preview", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as FinaNativoPreviewResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al analizar el archivo");
      setPreviewData(json);
      setMapping(json.suggestedMapping);
      setStep("mapping");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar el archivo");
      setStep("idle");
    }
  }

  // ── Step: importing ─────────────────────────────────────────────────────────

  async function handleImport() {
    if (!file) return;
    setError(null);
    setStep("importing");

    const form = new FormData();
    form.append("file", file);
    form.append("column_mapping", JSON.stringify(mapping));

    try {
      const res = await fetch("/api/admin/import/fina-nativo", { method: "POST", body: form });
      const json = (await res.json()) as FinaNativoImportResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setResult(json);
      setShowDetails(false);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
      setStep("mapping");
    }
  }

  // ── Mapping validation ──────────────────────────────────────────────────────

  const tipoMapped = Object.values(mapping).some(
    (r) => r.type === "field" && r.field === "tipo",
  );
  const nombreMapped = Object.values(mapping).some(
    (r) => r.type === "field" && r.field === "nombre",
  );
  const storesMapped = Object.values(mapping).some((r) => r.type === "store");
  const canImport = tipoMapped && nombreMapped;

  // ── Result helpers ──────────────────────────────────────────────────────────

  const statusIcon = (r: FinaNativoRowResult) => {
    if (r.status === "updated") return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
    if (r.status === "created") return <PlusCircle size={13} className="text-[#7B1847] shrink-0" />;
    if (r.status === "not_found" || r.status === "skipped")
      return <AlertCircle size={13} className="text-amber-500 shrink-0" />;
    return <XCircle size={13} className="text-red-500 shrink-0" />;
  };

  const statusLabel = (r: FinaNativoRowResult) => {
    if (r.status === "updated") return "Actualizado";
    if (r.status === "created") return "Creado";
    if (r.status === "not_found") return "No encontrado";
    if (r.status === "skipped") return "Omitido";
    return "Error";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Format hint */}
      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          Exporta desde <strong>Fina → Inventario → Exportar</strong>.
          Acepta <strong>CSV, XLSX, XLSM y XLS</strong>.
          Después de subir el archivo podrás confirmar qué columna corresponde a qué tienda o campo.
        </p>
      </div>

      {/* ── STEP: idle / parsing ─────────────────────────────────────────── */}
      {(step === "idle" || step === "parsing") && (
        <>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-[#29252A]">Archivo de inventario Fina</p>
            {file && step === "parsing" ? (
              <div className="flex items-center justify-between rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#29252A]">{file.name}</p>
                  <p className="text-xs text-[#29252A]/50">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <p className="text-xs text-[#29252A]/50 animate-pulse">Analizando…</p>
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

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600">
              <XCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </>
      )}

      {/* ── STEP: mapping ───────────────────────────────────────────────── */}
      {step === "mapping" && previewData && (
        <>
          {/* File bar */}
          <div className="flex items-center justify-between rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#29252A]">{file?.name}</p>
              <p className="text-xs text-[#29252A]/50">
                {previewData.columns.length} columnas detectadas
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setMapping({});
                setError(null);
                setStep("idle");
              }}
              className="text-xs text-[#29252A]/40 underline hover:text-[#29252A]/70"
            >
              Cambiar archivo
            </button>
          </div>

          {/* Mapping table */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#7B1847]" />
              <p className="text-sm font-semibold text-[#29252A]">
                Asignar columnas del archivo
              </p>
            </div>
            <p className="text-xs text-[#29252A]/50">
              Verifica que cada columna esté asignada correctamente. Los campos{" "}
              <strong>Tipo</strong> y <strong>Nombre</strong> son obligatorios.
              Asigna las columnas de cantidad a cada tienda correspondiente.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#EBE4E1]">
              <table className="w-full text-xs">
                <thead className="bg-[#F4EFEc]">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#29252A]/50 whitespace-nowrap">
                      Columna en archivo
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#29252A]/50 whitespace-nowrap">
                      Muestra de datos
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold text-[#29252A]/50 whitespace-nowrap">
                      Corresponde a
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.columns.map((col) => {
                    const role = mapping[col.index] ?? { type: "ignore" as const };
                    const summary = roleSummary(role);
                    const isRequired =
                      role.type === "field" &&
                      (role.field === "tipo" || role.field === "nombre");

                    return (
                      <tr
                        key={col.index}
                        className={`border-t border-[#EBE4E1] ${
                          isRequired ? "bg-[#FDF8FB]" : "bg-white"
                        }`}
                      >
                        {/* Column label */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-[#29252A]">
                            {col.label || `(col ${col.index})`}
                          </span>
                        </td>

                        {/* Samples */}
                        <td className="px-3 py-2.5 max-w-[200px]">
                          {col.samples.length > 0 ? (
                            <span className="text-[#29252A]/50 truncate block" title={col.samples.join(", ")}>
                              {col.samples.slice(0, 3).join(" · ")}
                            </span>
                          ) : (
                            <span className="text-[#29252A]/25">—</span>
                          )}
                        </td>

                        {/* Role select */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <select
                            value={roleToSelectValue(role)}
                            onChange={(e) =>
                              setMapping((prev) => ({
                                ...prev,
                                [col.index]: selectValueToRole(e.target.value, stores),
                              }))
                            }
                            className={`rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B1847]/30 ${
                              summary.color === "text-emerald-600"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : summary.color === "text-[#7B1847]"
                                  ? "border-[#F0D8E8] bg-[#FDF8FB] text-[#7B1847]"
                                  : "border-[#EBE4E1] bg-white text-[#29252A]/50"
                            }`}
                          >
                            <option value="ignore">Ignorar columna</option>
                            <optgroup label="Campos Fina">
                              <option value="field:tipo">Tipo (ítem / variación)</option>
                              <option value="field:nombre">Nombre del artículo</option>
                              <option value="field:sku">SKU</option>
                              <option value="field:categoria">Categoría</option>
                              <option value="field:costo_unitario">Costo unitario</option>
                              <option value="field:valor_inventario">Valor en inventario</option>
                              <option value="field:cantidad">Cantidad total</option>
                              <option value="field:sin_ubicacion">Sin ubicación</option>
                              <option value="field:cualquiera">Cualquiera</option>
                            </optgroup>
                            {stores.length > 0 && (
                              <optgroup label="Tiendas activas">
                                {stores.map((s) => (
                                  <option key={s.id} value={`store:${s.id}`}>
                                    {s.name}{s.code ? ` (${s.code})` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation messages */}
          {(!tipoMapped || !nombreMapped) && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">
                {!tipoMapped && !nombreMapped
                  ? 'Asigna las columnas "Tipo" y "Nombre" antes de importar.'
                  : !tipoMapped
                    ? 'Falta asignar la columna "Tipo (ítem / variación)".'
                    : 'Falta asignar la columna "Nombre del artículo".'}
              </p>
            </div>
          )}

          {canImport && !storesMapped && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-800">
                Ninguna columna está asignada a una tienda. El stock no se importará.
                Si el archivo tiene columnas de cantidad por sede, asígnalas arriba.
              </p>
            </div>
          )}

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600">
              <XCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            title={!canImport ? 'Asigna "Tipo" y "Nombre" para continuar' : undefined}
            className="self-start"
          >
            Importar desde Fina
          </Button>
        </>
      )}

      {/* ── STEP: importing ─────────────────────────────────────────────── */}
      {step === "importing" && (
        <div className="flex items-center gap-3 rounded-xl border border-[#EBE4E1] bg-white px-4 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7B1847] border-t-transparent" />
          <p className="text-sm text-[#29252A]/70">Importando inventario…</p>
        </div>
      )}

      {/* ── STEP: done ──────────────────────────────────────────────────── */}
      {step === "done" && result && (
        <div className="flex flex-col gap-3">

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreviewData(null);
              setMapping({});
              setResult(null);
              setError(null);
              setStep("idle");
            }}
            className="flex items-center gap-1.5 self-start text-xs text-[#29252A]/50 underline hover:text-[#29252A]/70"
          >
            <ArrowLeft size={12} />
            Nueva importación
          </button>

          {/* Detected stores */}
          {result.detectedStores.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-800">Tiendas importadas</p>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {result.detectedStores.map((s) => (
                  <li key={s} className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <Store size={11} className="shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unknown store columns (auto-detect path only) */}
          {result.unknownStoreColumns.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Columnas de sede no reconocidas</p>
              <p className="mt-1 text-xs text-amber-700">
                Las siguientes columnas no coinciden con ninguna sede activa. Créalas desde{" "}
                <strong>Admin → Entrega → Sucursales</strong>:
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {result.unknownStoreColumns.map((col) => (
                  <li key={col} className="flex items-center gap-2 text-xs">
                    <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 font-mono font-semibold text-amber-900">
                      {col}
                    </span>
                    <a
                      href="/admin/entrega/sucursales"
                      className="flex items-center gap-0.5 text-amber-700 underline hover:text-amber-900"
                    >
                      Crear sucursal <ExternalLink size={10} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No store at all */}
          {result.detectedStores.length === 0 && result.unknownStoreColumns.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2.5">
              <p className="text-xs font-semibold text-amber-800">Sin tienda asignada</p>
              <p className="mt-0.5 text-xs text-amber-700">
                No se importó stock porque ninguna columna estaba asignada a una tienda.
              </p>
            </div>
          )}

          {/* Summary counters */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Actualizados", value: result.updated, color: "text-emerald-600" },
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

          {/* Detail table */}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 self-start text-xs text-[#29252A]/50 underline"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDetails ? "Ocultar detalle" : `Ver detalle (${result.total} variantes)`}
          </button>

          {showDetails && (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-[#EBE4E1]">
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
                    <tr
                      key={i}
                      className={`border-t border-[#EBE4E1] ${r.status === "created" ? "bg-[#FDF8FB]" : "bg-white"}`}
                    >
                      <td className="px-3 py-2 font-medium text-[#29252A]">{r.item}</td>
                      <td className="px-3 py-2 text-[#29252A]/70">{r.size}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] text-[#29252A]/50">
                          {r.candidateSku}
                        </span>
                        {r.matchedBy === "name" && (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] text-amber-700">
                            nombre
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.storeResults && r.storeResults.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {r.storeResults.map((sr) => (
                              <span key={sr.storeName} className="text-[#29252A]/60">
                                {sr.storeName.split(" ").slice(0, 3).join(" ")}:{" "}
                                <span className="font-semibold text-[#29252A]">{sr.newQty}</span>
                                {sr.previousQty !== sr.newQty && sr.previousQty > 0 && (
                                  <span className="text-[#29252A]/30"> (antes {sr.previousQty})</span>
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
                          {r.message && (r.status === "not_found" || r.status === "error") && (
                            <span
                              className={r.status === "error" ? "text-red-400" : "text-[#29252A]/30"}
                              title={r.message}
                            >
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
