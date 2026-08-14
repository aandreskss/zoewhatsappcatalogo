"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUSES = [
  { value: "confirmado", label: "Confirmado" },
  { value: "pagado", label: "Pagado" },
  { value: "preparando", label: "Preparando" },
  { value: "listo_para_entregar", label: "Listo para entregar" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "nuevo", label: "Nuevo" },
  { value: "esperando_pago", label: "Esperando pago" },
];

const DEFAULT_STATUSES = ["confirmado", "pagado", "preparando", "listo_para_entregar", "enviado", "entregado"];

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function FinaExportForm() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [selected, setSelected] = useState<string[]>(DEFAULT_STATUSES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStatus(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  async function handleDownload() {
    if (!from || !to) {
      setError("Selecciona un rango de fechas.");
      return;
    }
    if (selected.length === 0) {
      setError("Selecciona al menos un estado.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        from,
        to,
        status: selected.join(","),
      });
      const res = await fetch(`/api/admin/export/pedidos?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? "Error al generar el CSV");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-fina-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al descargar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-from">Desde</Label>
          <Input
            id="export-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-to">Hasta</Label>
          <Input
            id="export-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-col gap-2">
        <Label>Estados a incluir</Label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = selected.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleStatus(s.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#C9748A] text-white"
                    : "bg-[#F4EFEc] text-[#29252A]/60 hover:bg-[#C9748A]/10 hover:text-[#C9748A]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            setSelected(
              selected.length === STATUSES.length ? [] : STATUSES.map((s) => s.value),
            )
          }
          className="self-start text-xs text-[#29252A]/40 underline"
        >
          {selected.length === STATUSES.length ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="self-start"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Generando CSV…
          </>
        ) : (
          <>
            <Download size={15} />
            Descargar CSV para Fina
          </>
        )}
      </Button>

      <p className="text-xs text-[#29252A]/40">
        El archivo se abre directamente en Excel. Una fila por cada línea de pedido.
      </p>
    </div>
  );
}
