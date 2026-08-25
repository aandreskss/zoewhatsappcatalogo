import Link from "next/link";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { Button } from "@/components/ui/button";
import { Search, Plus, Upload } from "lucide-react";
import { ProductsTable } from "@/components/admin/products-table";

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
  const supabase = createSupabaseServiceRoleClient();

  const [{ count: totalCount }, { data: products, error }] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    (() => {
      let query = supabase
        .from("products")
        .select("id, name, sku, status, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (q) query = query.ilike("name", `%${q}%`);
      if (estado && STATUS_CONFIG[estado])
        query = query.eq("status", estado as "published" | "draft" | "hidden" | "archived");
      return query;
    })(),
  ]);

  const hasFilters = !!(q || estado);

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
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#29252A]">Productos</h1>
            <span className="rounded-full bg-[#F0D8E8] px-2.5 py-0.5 text-xs font-semibold text-[#7B1847]">
              {totalCount ?? 0}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[#29252A]/50">
            {hasFilters
              ? `${(products ?? []).length} resultado${(products ?? []).length !== 1 ? "s" : ""}`
              : `${totalCount ?? 0} producto${(totalCount ?? 0) !== 1 ? "s" : ""} en total`}
            {estado && STATUS_CONFIG[estado] ? ` · ${STATUS_CONFIG[estado].label}` : ""}
            {q ? ` · "${q}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/productos/importar" className="flex items-center gap-1.5">
              <Upload size={15} />
              Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/productos/nuevo" className="flex items-center gap-1.5">
              <Plus size={15} />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <form method="get" className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#29252A]/35 pointer-events-none"
          />
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

      <ProductsTable products={products ?? []} hasFilters={hasFilters} />
    </div>
  );
}
