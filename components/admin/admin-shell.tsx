import Link from "next/link";
import type { AdminSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Navegación por secciones (sección 19/91 del plan). Se enlaza únicamente
 * a lo que ya existe como pantalla real hasta la Fase 5 — el resto de
 * módulos (Marketing, Finanzas, Configuración) se agrega cuando su
 * implementación exista, para no enlazar a rutas 404.
 */
const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/finanzas/monedas", label: "Monedas" },
  { href: "/admin/finanzas/metodos-pago", label: "Métodos de pago" },
  { href: "/admin/entrega/pickup", label: "Retiro/Delivery" },
  { href: "/admin/entrega/delivery", label: "Zonas de delivery" },
  { href: "/admin/entrega/envios", label: "Envíos" },
  { href: "/admin/entrega/horarios", label: "Horarios" },
  { href: "/admin/marketing/home", label: "Home" },
  { href: "/admin/marketing/banners", label: "Banners" },
  { href: "/admin/integraciones/analytics", label: "Analítica" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/apariencia/branding", label: "Branding" },
  { href: "/admin/seguridad", label: "Seguridad" },
  { href: "/admin/salud", label: "Salud" },
];

export function AdminShell({
  user,
  children,
}: {
  user: AdminSessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 py-4">
        <div>
          <p className="text-sm font-semibold">Zoe — Panel administrativo</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {user.email} {user.roles.length > 0 ? `· ${user.roles.join(", ")}` : ""}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Salir
          </Button>
        </form>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-sm whitespace-nowrap hover:bg-[var(--color-muted)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
