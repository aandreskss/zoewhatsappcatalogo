"use client";

import { useState } from "react";
import { ImportProductsForm } from "@/components/admin/import-products-form";
import { ImportProductsCustomForm } from "@/components/admin/import-products-custom-form";

interface Store {
  id: string;
  name: string;
  code: string | null;
}

interface Props {
  stores: Store[];
}

const TABS = [
  {
    key: "fina" as const,
    label: "Formato nativo Fina",
    desc: "CSV jerárquico exportado desde Fina (Item / Variación)",
  },
  {
    key: "custom" as const,
    label: "Formato personalizado",
    desc: "CSV plano con categoría, tallas, precio e inventario por tienda",
  },
];

export function ImportProductsTabs({ stores }: Props) {
  const [format, setFormat] = useState<"fina" | "custom">("fina");

  return (
    <div className="flex flex-col gap-6">
      {/* Format selector */}
      <div className="grid grid-cols-2 gap-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFormat(t.key)}
            className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
              format === t.key
                ? "border-[#7B1847] bg-[#7B1847]/5"
                : "border-[#EBE4E1] hover:border-[#7B1847]/40"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                format === t.key ? "text-[#7B1847]" : "text-[#29252A]"
              }`}
            >
              {t.label}
            </p>
            <p className="mt-0.5 text-xs text-[#29252A]/50">{t.desc}</p>
          </button>
        ))}
      </div>

      {format === "fina" ? (
        <ImportProductsForm />
      ) : (
        <ImportProductsCustomForm stores={stores} />
      )}
    </div>
  );
}
