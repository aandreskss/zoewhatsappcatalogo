import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/db/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos y archivos de imagen —
     * necesitamos que corra en /admin/* (auth) y en el resto del sitio
     * (para mantener la sesión de Supabase fresca si en el futuro hay
     * áreas autenticadas fuera del admin, como una cuenta de cliente).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)",
  ],
};
