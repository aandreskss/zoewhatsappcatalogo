import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { FinaExportForm } from "@/components/admin/fina-export-form";
import { FinaImportForm } from "@/components/admin/fina-import-form";

export const dynamic = "force-dynamic";

export default async function FinaIntegrationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, code")
    .eq("active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9748A]/10">
          <span className="text-lg font-bold text-[#C9748A]">F</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#29252A]">Integración con Fina Partner</h1>
          <p className="text-sm text-[#29252A]/50">
            Exporta pedidos a Fina para gestión financiera · Importa inventario desde Fina en masa
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export card */}
        <div className="rounded-2xl border border-[#EBE4E1] bg-white p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Zoe → Fina
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-[#29252A]">Exportar pedidos</h2>
            <p className="mt-1 text-sm text-[#29252A]/50">
              Descarga un CSV con los pedidos del período seleccionado, listo para importar en Fina como ventas o facturas.
            </p>
          </div>
          <FinaExportForm />
        </div>

        {/* Import card */}
        <div className="rounded-2xl border border-[#EBE4E1] bg-white p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Fina → Zoe
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-[#29252A]">Importar inventario</h2>
            <p className="mt-1 text-sm text-[#29252A]/50">
              Sube un CSV exportado desde Fina para actualizar el stock de tus productos en masa. Elige si manejas un solo almacén o divides por sucursal.
            </p>
          </div>
          <FinaImportForm stores={stores ?? []} />
        </div>
      </div>

      {/* Help section */}
      <div className="rounded-2xl border border-[#EBE4E1] bg-[#F4EFEc] p-6">
        <h3 className="text-sm font-semibold text-[#29252A]">¿Cómo usar esta integración?</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9748A]">
              Exportar pedidos a Fina
            </p>
            <ol className="mt-2 flex flex-col gap-1 text-xs text-[#29252A]/70">
              <li>1. Elige el rango de fechas y estados.</li>
              <li>2. Descarga el CSV.</li>
              <li>3. En Fina: Ventas → Importar → sube el CSV.</li>
            </ol>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9748A]">
              Importar inventario desde Fina
            </p>
            <ol className="mt-2 flex flex-col gap-1 text-xs text-[#29252A]/70">
              <li>1. En Fina: Inventario → Exportar → CSV.</li>
              <li>2. Asegúrate de que el CSV tiene columna "sku" y "cantidad".</li>
              <li>3. Elige la modalidad y sube el archivo aquí.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
