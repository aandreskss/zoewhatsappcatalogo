import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mensaje?: string }>;
}) {
  const { next, error, mensaje } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Zoe — Panel administrativo</CardTitle>
          <CardDescription>Acceso restringido al personal de Zoe.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error === "link_invalido" && (
            <p role="alert" className="text-sm text-red-600">
              El enlace es inválido o ya expiró. Solicita uno nuevo.
            </p>
          )}
          {mensaje === "contrasena_actualizada" && (
            <p role="status" className="text-sm text-green-600">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </p>
          )}
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
