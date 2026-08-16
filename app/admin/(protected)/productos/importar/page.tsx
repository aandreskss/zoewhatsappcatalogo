import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportProductsForm } from "@/components/admin/import-products-form";

export default function ImportProductsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="text-sm text-[#29252A]/50 hover:text-[#29252A] flex items-center gap-1">
          <ArrowLeft size={14} /> Productos
        </Link>
        <span className="text-[#29252A]/20">/</span>
        <span className="text-sm text-[#29252A]">Importar</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-[#29252A]">Importar productos desde Fina</h1>
        <p className="mt-1 text-sm text-[#29252A]/50">
          Crea los productos en borrador a partir de un archivo de inventario Fina. El stock se importa desde la sección Integraciones → Fina.
        </p>
      </div>
      <ImportProductsForm />
    </div>
  );
}
