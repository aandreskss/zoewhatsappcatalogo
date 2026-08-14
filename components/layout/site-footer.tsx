import Link from "next/link";

/**
 * Footer público (sección 28/29 del plan). Solo enlaces a rutas reales del
 * sitio — nada de teléfono/dirección/redes inventados aquí: esos datos
 * viven por sucursal en `/tiendas` (regla permanente: no hardcodear datos
 * de negocio).
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:justify-between">
        <div>
          <p className="font-semibold">Zoe Shoes</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-muted-foreground)]">
            Encuentra tu talla y arma tu pedido para coordinarlo por WhatsApp.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/catalogo" className="hover:underline">
            Catálogo
          </Link>
          <Link href="/buscar" className="hover:underline">
            Buscar
          </Link>
          <Link href="/tiendas" className="hover:underline">
            Nuestras tiendas
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-[var(--color-muted-foreground)]">
        © {new Date().getFullYear()} Zoe Shoes.
      </p>
    </footer>
  );
}
