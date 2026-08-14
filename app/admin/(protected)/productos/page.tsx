import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { Button } from "@/components/ui/button";
import { Search, Package, Plus } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-emerald-100 text-emerald-700" },
  draft:     { label: "Borrador",  className: "bg-[#F4EFEc] text-[#29252A]/50" },
  hidden:    { label: "Oculto",    className: "bg-amber-100 text-amber-700" },
  archived:  { label: "Archivado", className: "bg-red-100 text-red-600" },
};

const STATUS_FILTER = [
  { value: "", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Borradores" },
  { value: "hidden", label: "Ocultos" },
  { value: "archived", label: "Archivados" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select("id, name, sku, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) query = query.ilike("name", `%${q}%`);
  if (estado && STATUS_CONFIG[estado]) query = query.eq("status", estado as "published" | "draft" | "hidden" | "archived");

  const { data: products, error } = await query;

  function filterHref(params: { q?: string; estado?: string }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.estado) sp.set("estado", params.estado);
    const qs = sp.toString();
    return `/admin/productos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#29252A]">Productos</h1>
          <p className="mt-0.5 text-sm text-[#29252A]/50">
            {(products ?? []).length} resultado{(products ?? []).length !== 1 ? "s" : ""}
            {estado && STATUS_CONFIG[estado] ? ` · ${STATUS_CONFIG[estado].label}` : ""}
            {q ? ` · "${q}"` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo" className="flex items-center gap-1.5">
            <Plus size={15} />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <form method="get" className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#29252A]/35 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            className="w-full rounded-xl border border-[#EBE4E1] bg-white py-2.5 pl-9 pr-4 text-sm placeholder:text-[#29252A]/35 focus:outline-none focus:ring-2 focus:ring-[#C9748A]/20 focus:border-[#C9748A]/40"
          />
          {estado && <input type="hidden" name="estado" value={estado} />}
        </form>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER.map((s) => {
            const active = s.value === "" ? !estado : estado === s.value;
            return (
              <Link
                key={s.value}
                href={filterHref({ q, estado: s.value || undefined })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#C9748A] text-white shadow-sm"
                    : "border border-[#EBE4E1] bg-white text-[#29252A]/60 hover:border-[#C9748A]/30 hover:text-[#C9748A]"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">Error al cargar productos: {error.message}</p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE4E1] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EBE4E1] bg-[#F4EFEc]">
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
            {(products ?? []).map((product) => {
              const statusCfg = STATUS_CONFIG[product.status] ?? { label: product.status, className: "bg-gray-100 text-gray-600" };
              return (
                <tr
                  key={product.id}
                  className="border-t border-[#EBE4E1] transition-colors hover:bg-[#F4EFEc]/50"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#29252A]">{product.name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-[#29252A]/50">
                      {product.sku ?? "—"}
                    </span>
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

            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
                      <Package size={20} className="text-[#29252A]/25" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#29252A]">
                        {q || estado ? "Sin resultados" : "Aún no hay productos"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#29252A]/45">
                        {q || estado
                          ? "Prueba con otro filtro o término de búsqueda"
                          : "Crea tu primer producto para empezar"}
                      </p>
                    </div>
                    {q || estado ? (
                      <Link
                        href="/admin/productos"
                        className="mt-1 rounded-lg border border-[#EBE4E1] px-3 py-1.5 text-xs font-medium text-[#29252A]/60 hover:bg-[#F4EFEc] transition-colors"
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
    </div>
  );
}
