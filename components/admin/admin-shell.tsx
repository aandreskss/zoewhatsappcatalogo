import type { AdminSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Shell mínimo del dashboard (sección 19/91 del plan). La navegación
 * completa por secciones (Catálogo, Inventario, Marketing, Finanzas…) se
 * construye a partir de la Fase 2 en adelante, a medida que cada módulo
 * exista de verdad — no tiene sentido enlazar a pantallas que todavía no
 * están construidas.
 */
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
