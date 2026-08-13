import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminSessionUser } from "@/lib/auth/session";

/**
 * Dashboard placeholder de la Fase 0. Los KPIs reales (pedidos hoy,
 * conversión, producto top, etc. — sección 35 del plan) se construyen en la
 * Fase 9, una vez existan pedidos y eventos de analítica que agregar.
 */
export default async function AdminDashboardPage() {
  const user = await getAdminSessionUser();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Fase 0 completada</CardTitle>
          <CardDescription>
            Autenticación, modelo de datos y estructura del proyecto están listos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted-foreground)]">
          <p>
            Sesión activa:{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {user?.email}
            </span>
          </p>
          <p className="mt-1">
            Roles asignados:{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {user && user.roles.length > 0
                ? user.roles.join(", ")
                : "ninguno todavía (asignar en Supabase o vía seed)"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
