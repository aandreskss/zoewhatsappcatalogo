import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { ImportProductsTabs } from "@/components/admin/import-products-tabs";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, code")
    .eq("active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/productos"
          className="text-sm text-[#29252A]/50 hover:text-[#29252A] flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Productos
        </Link>
        <span className="text-[#29252A]/20">/</span>
        <span className="text-sm text-[#29252A]">Importar</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-[#29252A]">Importar productos</h1>
        <p className="mt-1 text-sm text-[#29252A]/50">
          Crea productos en borrador a partir de un archivo CSV. Elige el formato según tu fuente de datos.
        </p>
      </div>
      <ImportProductsTabs stores={stores ?? []} />
    </div>
  );
}
