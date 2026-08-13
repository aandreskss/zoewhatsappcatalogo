import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Archivado",
};

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Button asChild>
          <Link href="/admin/productos/nuevo">Nuevo producto</Link>
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error)]">
          Error al cargar productos: {error.message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-muted)] text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Estado</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => (
              <tr key={product.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {product.sku ?? "—"}
                </td>
                <td className="p-3">{STATUS_LABEL[product.status] ?? product.status}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/productos/${product.id}`} className="underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-[var(--color-muted-foreground)]"
                >
                  Todavía no hay productos. Crea el primero.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
