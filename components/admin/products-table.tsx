"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { bulkDeleteProducts } from "@/app/admin/(protected)/productos/actions";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-emerald-100 text-emerald-700" },
  draft:     { label: "Borrador",  className: "bg-[#F4EFEc] text-[#29252A]/50" },
  hidden:    { label: "Oculto",    className: "bg-amber-100 text-amber-700" },
  archived:  { label: "Archivado", className: "bg-red-100 text-red-600" },
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  created_at: string;
};

export function ProductsTable({
  products,
  hasFilters,
}: {
  products: Product[];
  hasFilters: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (
      !confirm(
        `¿Eliminar ${selected.size} producto${selected.size !== 1 ? "s" : ""}?\nEsta acción no se puede deshacer.`,
      )
    )
      return;
    const ids = Array.from(selected);
    startTransition(async () => {
      await bulkDeleteProducts(ids);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-[#EBE4E1] bg-[#FDF8FB] px-4 py-2.5">
          <span className="text-sm font-semibold text-[#29252A]">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 size={13} />
            {isPending ? "Eliminando…" : "Eliminar seleccionados"}
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
            <th className="w-10 px-4 py-3">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={products.length === 0}
                className="h-4 w-4 cursor-pointer rounded accent-[#7B1847] disabled:cursor-default"
              />
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
              Producto
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40">
              Creado
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isSelected = selected.has(product.id);
            const statusCfg =
              STATUS_CONFIG[product.status] ?? { label: product.status, className: "bg-gray-100 text-gray-600" };
            return (
              <tr
                key={product.id}
                className={`border-t border-[#EBE4E1] transition-colors ${
                  isSelected ? "bg-[#F0D8E8]/25" : "hover:bg-[#F4EFEc]/50"
                }`}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(product.id)}
                    className="h-4 w-4 cursor-pointer rounded accent-[#7B1847]"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[#29252A]">{product.name}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-[#29252A]/50">{product.sku ?? "—"}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#29252A]/50">
                  {new Date(product.created_at).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DeleteProductButton productId={product.id} productName={product.name} variant="icon" />
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#C9748A] transition-colors hover:bg-[#C9748A]/10"
                    >
                      Editar →
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}

          {products.length === 0 && (
            <tr>
              <td colSpan={6}>
                <div className="flex flex-col items-center gap-3 py-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
                    <Package size={20} className="text-[#29252A]/25" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#29252A]">
                      {hasFilters ? "Sin resultados" : "Aún no hay productos"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#29252A]/45">
                      {hasFilters
                        ? "Prueba con otro filtro o término de búsqueda"
                        : "Crea tu primer producto para empezar"}
                    </p>
                  </div>
                  {hasFilters ? (
                    <Link
                      href="/admin/productos"
                      className="mt-1 rounded-lg border border-[#EBE4E1] px-3 py-1.5 text-xs font-medium text-[#29252A]/60 transition-colors hover:bg-[#F4EFEc]"
                    >
                      Ver todos
                    </Link>
                  ) : (
                    <Button asChild size="sm">
                      <Link href="/admin/productos/nuevo">Crear producto</Link>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
