"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type {
  ImportProductsResponse,
  ImportProductResult,
} from "@/app/api/admin/import/productos/route";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "idle" | "uploading" | "done";

const ACCEPTED = ".csv,.xlsx,.xlsm,.xls";

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportProductsForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportProductsResponse | null>(null);

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
    setStep("idle");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!file) return;
    setError(null);
    setStep("uploading");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/import/productos", { method: "POST", body: form });
      const json = (await res.json()) as ImportProductsResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setResult(json);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
      setStep("idle");
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setStep("idle");
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function statusIcon(r: ImportProductResult) {
    if (r.status === "created") return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
    if (r.status === "exists") return <AlertCircle size={13} className="text-amber-500 shrink-0" />;
    return <XCircle size={13} className="text-red-500 shrink-0" />;
  }

  function statusLabel(r: ImportProductResult) {
    if (r.status === "created") return `Creado · ${r.variantsCreated ?? 0} talla(s)`;
    if (r.status === "exists") return "Ya existe";
    return "Error";
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ── STEP: idle ──────────────────────────────────────────────────── */}
      {step !== "done" && (
        <div className="flex flex-col gap-3">
          {/* Dropzone */}
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-[#EBE4E1] bg-[#F4EFEc] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#29252A]">{file.name}</p>
                <p className="text-xs text-[#29252A]/50">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {step !== "uploading" && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-[#29252A]/40 underline hover:text-[#29252A]/70"
                >
                  Cambiar archivo
                </button>
              )}
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

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600">
              <XCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          {/* Upload button */}
          {step === "uploading" ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#EBE4E1] bg-white px-4 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7B1847] border-t-transparent" />
              <p className="text-sm text-[#29252A]/70">Importando productos…</p>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleImport}
              disabled={!file}
              className="self-start"
            >
              Importar productos
            </Button>
          )}
        </div>
      )}

      {/* ── STEP: done ──────────────────────────────────────────────────── */}
      {step === "done" && result && (
        <div className="flex flex-col gap-4">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Creados", value: result.created, color: "text-emerald-600" },
              { label: "Ya existían", value: result.exists, color: "text-amber-600" },
              { label: "Errores", value: result.errors, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#EBE4E1] bg-white p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] leading-tight text-[#29252A]/50">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Link to drafts */}
          {result.created > 0 && (
            <div className="rounded-xl border border-[#F0D8E8] bg-[#FDF8FB] px-4 py-3">
              <p className="text-xs font-semibold text-[#7B1847]">
                {result.created} producto(s) creado(s) en borrador
              </p>
              <p className="mt-1 text-xs text-[#7B1847]/70">
                Agrega imágenes y precios de venta antes de publicarlos.
              </p>
              <Link
                href="/admin/productos?estado=draft"
                className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#7B1847] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#7B1847]/80"
              >
                Ver nuevos productos en borrador →
              </Link>
            </div>
          )}

          {/* Results table */}
          <div className="max-h-96 overflow-y-auto rounded-xl border border-[#EBE4E1]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#F4EFEc]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Producto</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">SKU</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#29252A]/60">Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-[#EBE4E1] ${r.status === "created" ? "bg-[#FDF8FB]" : "bg-white"}`}
                  >
                    <td className="px-3 py-2 font-medium text-[#29252A]">{r.name}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] text-[#29252A]/50">
                        {r.sku || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          {statusIcon(r)}
                          <span className={r.status === "created" ? "font-semibold text-[#7B1847]" : ""}>
                            {statusLabel(r)}
                          </span>
                        </span>
                        {r.status === "error" && r.message && (
                          <span className="text-[10px] leading-tight text-red-400">{r.message}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="self-start text-xs text-[#29252A]/50 underline hover:text-[#29252A]/70"
          >
            Nueva importación
          </button>
        </div>
      )}
    </div>
  );
}
