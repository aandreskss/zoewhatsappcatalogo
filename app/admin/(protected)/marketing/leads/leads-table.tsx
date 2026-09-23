"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(leads: Lead[]) {
  const header = "Nombre,Teléfono,Email,Fuente,Fecha\n";
  const rows = leads.map((l) =>
    [l.name, l.phone, l.email ?? "", l.source, formatDate(l.created_at)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob(["﻿" + header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lista-vip-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsTable({
  leads,
  searchQuery,
}: {
  leads: Lead[];
  searchQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = React.useState(searchQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-[#EBE0E7] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-[#EBE0E7] flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Buscar por nombre, teléfono o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-[#EBE0E7] text-sm text-[#29252A] focus:outline-none focus:border-[#7B1847]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#7B1847] text-white text-sm font-semibold"
          >
            Buscar
          </button>
        </form>
        <button
          type="button"
          onClick={() => exportCsv(leads)}
          disabled={leads.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBE0E7] text-sm font-semibold text-[#29252A] hover:bg-[#F0D8E8] transition-colors disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0D8E8] flex items-center justify-center mx-auto mb-4">
            <span style={{ fontSize: 22 }}>👑</span>
          </div>
          <p className="text-sm font-semibold text-[#29252A]">
            {searchQuery ? "Sin resultados para esa búsqueda" : "Aún no hay registros"}
          </p>
          <p className="text-xs text-[#29252A]/50 mt-1">
            {!searchQuery && "Cuando alguien se una a la lista VIP aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EBE0E7]">
                {["Nombre", "Teléfono", "Email", "Fecha de registro"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#FDF8FB]"}
                >
                  <td className="px-5 py-3.5 font-medium text-[#29252A]">{lead.name}</td>
                  <td className="px-5 py-3.5 text-[#29252A]/80">
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#7B1847] transition-colors"
                    >
                      {lead.phone}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-[#29252A]/70">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="hover:text-[#7B1847] transition-colors">
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-[#29252A]/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[#29252A]/50 text-xs whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leads.length > 0 && (
        <div className="px-5 py-3 border-t border-[#EBE0E7] text-xs text-[#29252A]/40">
          {leads.length} {leads.length === 1 ? "registro" : "registros"}
          {searchQuery && " encontrados"}
        </div>
      )}
    </div>
  );
}
