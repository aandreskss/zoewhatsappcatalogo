import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { FinaExportForm } from "@/components/admin/fina-export-form";
import { FinaImportForm } from "@/components/admin/fina-import-form";
import { FinaNativoImportForm } from "@/components/admin/fina-nativo-import-form";
import { Download } from "lucide-react";

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

      {/* Cards */}
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

        {/* Import native Fina format card */}
        <div className="rounded-2xl border border-[#7B1847]/20 bg-white p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F0D8E8] px-2.5 py-0.5 text-xs font-semibold text-[#7B1847]">
                Fina → Zoe
              </span>
              <span className="rounded-full bg-[#7B1847] px-2.5 py-0.5 text-xs font-semibold text-white">
                Formato nativo
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-[#29252A]">Importar inventario desde Fina</h2>
            <p className="mt-1 text-sm text-[#29252A]/50">
              Sube el CSV exportado directamente desde Fina con formato jerárquico (Item / Variación).
              Las sucursales y el costo se detectan automáticamente.
            </p>
          </div>
          <FinaNativoImportForm />
        </div>
      </div>

      {/* Import custom format card */}
      <div className="rounded-2xl border border-[#EBE4E1] bg-white p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Fina → Zoe
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Formato personalizado
            </span>
          </div>
          <h2 className="mt-2 text-base font-bold text-[#29252A]">Importar inventario (CSV plano)</h2>
          <p className="mt-1 text-sm text-[#29252A]/50">
            Importa con un CSV simple de columnas <code className="rounded bg-[#F4EFEc] px-1">sku, cantidad</code>.
            Útil para ajustes manuales o archivos preparados a mano.
          </p>
        </div>
        <FinaImportForm stores={stores ?? []} />
      </div>

      {/* Help section */}
      <div className="flex flex-col gap-6 rounded-2xl border border-[#EBE4E1] bg-[#F4EFEc] p-6">

        {/* How to use */}
        <div>
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
              <a
                href="/samples/ejemplo-zoe-a-fina.csv"
                download
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#EBE4E1] bg-white px-3 py-1.5 text-xs font-medium text-[#29252A]/60 transition-colors hover:border-[#C9748A]/40 hover:text-[#C9748A]"
              >
                <Download size={11} />
                Descargar CSV de ejemplo
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C9748A]">
                Importar inventario desde Fina
              </p>
              <ol className="mt-2 flex flex-col gap-1 text-xs text-[#29252A]/70">
                <li>1. En Fina: Inventario → Exportar → CSV.</li>
                <li>2. Asegúrate de que el CSV tiene columna &quot;sku&quot; y &quot;cantidad&quot;.</li>
                <li>3. Elige la modalidad y sube el archivo aquí.</li>
              </ol>
              <a
                href="/samples/ejemplo-fina-a-zoe.csv"
                download
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#EBE4E1] bg-white px-3 py-1.5 text-xs font-medium text-[#29252A]/60 transition-colors hover:border-[#C9748A]/40 hover:text-[#C9748A]"
              >
                <Download size={11} />
                Descargar CSV de ejemplo
              </a>
            </div>
          </div>
        </div>

        {/* Column legend */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Zoe → Fina */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#C9748A]">
              Columnas del CSV Zoe → Fina
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { col: "Número de pedido", desc: "ID único del pedido (ej. ZOE-2024-001)" },
                { col: "Fecha", desc: "Fecha de creación del pedido" },
                { col: "Estado", desc: "Estado actual: Pagado, Confirmado, Entregado…" },
                { col: "Cliente", desc: "Nombre completo del comprador" },
                { col: "Teléfono", desc: "Número de contacto del cliente" },
                { col: "Email", desc: "Correo del cliente (puede estar vacío)" },
                { col: "Método de pago", desc: "Ej. Transferencia, Pago móvil, Efectivo USD" },
                { col: "Método de entrega", desc: "Retiro en tienda, Delivery o Envío nacional" },
                { col: "Ciudad / Estado", desc: "Ubicación del cliente" },
                { col: "Producto", desc: "Nombre del producto en esa línea" },
                { col: "SKU", desc: "Código de referencia de la variante" },
                { col: "Variante", desc: "Ej. 36 / Negro (talla y color)" },
                { col: "Cantidad", desc: "Unidades compradas en esa línea" },
                { col: "Precio unit. USD", desc: "Precio unitario en dólares" },
                { col: "Descuento línea USD", desc: "Descuento aplicado a esa línea" },
                { col: "Subtotal línea USD", desc: "Precio × Cantidad − Descuento" },
                { col: "Envío USD", desc: "Costo de envío (solo en la primera línea del pedido)" },
                { col: "Total pedido USD", desc: "Total general (solo en la primera línea)" },
                { col: "Tasa de cambio", desc: "Tasa Bs/USD usada al momento del pedido" },
                { col: "Par de monedas", desc: "Ej. VES/USD" },
                { col: "Notas de pago", desc: "Observaciones libres del pedido" },
              ].map(({ col, desc }) => (
                <div key={col} className="flex gap-2 text-xs">
                  <span className="w-36 shrink-0 font-mono font-semibold text-[#29252A]/70">{col}</span>
                  <span className="text-[#29252A]/50">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fina → Zoe */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#C9748A]">
              Columnas del CSV Fina → Zoe
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { col: "sku", req: true, desc: "Código exacto de la variante en Zoe. Obligatorio." },
                { col: "cantidad", req: true, desc: "Stock a establecer. Acepta también: stock, existencia, qty, quantity." },
                { col: "precio_costo", req: false, desc: "Costo unitario en USD. Acepta también: costo, cost. Opcional." },
                { col: "precio_venta", req: false, desc: "Precio de venta en USD. Acepta también: precio, price. Opcional." },
                { col: "tienda", req: false, desc: "Código de sucursal (ej. ZOE-CCS). Requerido en modo multi-sucursal. Acepta también: sucursal, store_code, codigo_tienda." },
              ].map(({ col, req, desc }) => (
                <div key={col} className="flex gap-2 text-xs">
                  <span className="w-28 shrink-0">
                    <span className="font-mono font-semibold text-[#29252A]/70">{col}</span>
                    {req ? (
                      <span className="ml-1 text-[10px] font-bold text-red-500">*</span>
                    ) : (
                      <span className="ml-1 text-[10px] text-[#29252A]/30">opt</span>
                    )}
                  </span>
                  <span className="text-[#29252A]/50">{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[#29252A]/40">
              * Los encabezados no distinguen mayúsculas ni tildes —{" "}
              <span className="font-mono">Cantidad</span>,{" "}
              <span className="font-mono">CANTIDAD</span> y{" "}
              <span className="font-mono">cantidad</span> son equivalentes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
