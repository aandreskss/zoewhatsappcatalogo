"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import {
  Home,
  ShoppingBag,
  Users,
  Package,
  Tag,
  Bookmark,
  DollarSign,
  CreditCard,
  Store,
  MapPin,
  Truck,
  Clock,
  LayoutDashboard,
  Image,
  BarChart2,
  FileText,
  Palette,
  Type,
  Shield,
  Activity,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Inicio", icon: Home, exact: true }],
  },
  {
    label: "Ventas",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorías", icon: Tag },
      { href: "/admin/marcas", label: "Marcas", icon: Bookmark },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/admin/finanzas/monedas", label: "Monedas", icon: DollarSign },
      { href: "/admin/finanzas/metodos-pago", label: "Métodos de pago", icon: CreditCard },
    ],
  },
  {
    label: "Logística",
    items: [
      { href: "/admin/entrega/pickup", label: "Retiro / Delivery", icon: Store },
      { href: "/admin/entrega/delivery", label: "Zonas de delivery", icon: MapPin },
      { href: "/admin/entrega/envios", label: "Envíos", icon: Truck },
      { href: "/admin/entrega/horarios", label: "Horarios", icon: Clock },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/marketing/home", label: "Home", icon: LayoutDashboard },
      { href: "/admin/marketing/banners", label: "Banners", icon: Image },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/integraciones/analytics", label: "Analítica", icon: BarChart2 },
      { href: "/admin/reportes", label: "Reportes", icon: FileText },
      { href: "/admin/apariencia/branding", label: "Branding", icon: Palette },
      { href: "/admin/apariencia/contenido", label: "Contenido del sitio", icon: Type },
      { href: "/admin/seguridad", label: "Seguridad", icon: Shield },
      { href: "/admin/salud", label: "Salud del sistema", icon: Activity },
    ],
  },
];

function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActive(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-[#C9748A]/20 text-[#C9748A]"
          : "text-white/60 hover:bg-white/6 hover:text-white/90"
      }`}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C9748A]" />}
    </Link>
  );
}

function Sidebar({
  user,
  pathname,
  onClose,
}: {
  user: AdminSessionUser;
  pathname: string;
  onClose?: () => void;
}) {
  const initials = user.email?.slice(0, 2).toUpperCase() ?? "ZO";

  return (
    <div className="flex h-full flex-col bg-[#29252A]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div>
          <span
            className="font-display text-2xl tracking-tight text-[#C9748A]"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Zoe
          </span>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
            Admin
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-white/40 hover:text-white/80">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mx-4 h-px bg-white/8" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {group.label && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-4 h-px bg-white/8" />

      {/* User + logout */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9748A]/20 text-xs font-semibold text-[#C9748A]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/80">{user.email}</p>
            {user.roles.length > 0 && (
              <p className="text-[10px] text-white/30 capitalize">
                {user.roles[0]?.replace("_", " ")}
              </p>
            )}
          </div>
        </div>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 transition-colors hover:bg-white/6 hover:text-white/70"
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminShellInner({
  user,
  children,
}: {
  user: AdminSessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const activeItem = NAV_GROUPS.flatMap((g) => g.items).find((item) =>
    isActive(item, pathname),
  );
  // Assign to a capitalized variable so React treats it as a component, not an HTML tag
  const ActiveIcon = activeItem?.icon ?? null;

  return (
    <div className="flex min-h-screen bg-[#F4EFEc]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-56 flex-col shadow-lg">
        <Sidebar user={user} pathname={pathname} />
      </aside>

      {/* Sidebar mobile — overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 shadow-2xl md:hidden">
            <Sidebar user={user} pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col md:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-[#EBE4E1] bg-white/80 px-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-[#29252A]/50 hover:bg-[#F4EFEc] md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-1 items-center gap-2">
            {ActiveIcon && activeItem && (
              <>
                <ActiveIcon size={16} className="text-[#C9748A]" strokeWidth={2} />
                <h1 className="text-sm font-semibold text-[#29252A]">{activeItem.label}</h1>
              </>
            )}
          </div>

          {/* Brand pill en mobile */}
          <span
            className="font-display text-lg text-[#C9748A] md:hidden"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Zoe
          </span>
        </header>

        {/* Página */}
        <main className="flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminSessionUser;
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AdminShellInner user={user}>{children}</AdminShellInner>
    </Suspense>
  );
}
