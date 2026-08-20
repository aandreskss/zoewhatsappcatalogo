"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  // No se valida longitud/formato de la contraseña aquí: Supabase Auth es
  // quien determina si es correcta. Solo se exige que no venga vacía.
  password: z.string().min(1, "La contraseña es obligatoria"),
  next: z.string().startsWith("/admin").optional(),
});

export interface SignInState {
  error: string | null;
}

/**
 * Server Action de login del admin. El schema con zod valida el input
 * (regla permanente: todo input externo se valida en servidor, el
 * formulario del cliente es solo UX), y Supabase Auth es la única fuente de
 * verdad sobre si la credencial es correcta — este proyecto no reimplementa
 * hashing de contraseñas ni gestión de sesiones a mano.
 */
export async function signInWithPassword(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // Rate limit de login (sección 23 del plan) — por email (frena fuerza
  // bruta contra una cuenta puntual, sin importar desde cuántas IPs
  // distintas) y por IP (frena a alguien probando muchos correos desde el
  // mismo origen). El mensaje al agotarse el límite es el mismo genérico
  // de credenciales incorrectas: no delata que existe un límite ni cuál de
  // los dos se disparó.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const emailRate = checkRateLimit(`login-email:${parsed.data.email}`, 5, 15 * 60_000);
  const ipRate = checkRateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
  if (!emailRate.allowed || !ipRate.allowed) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensaje genérico a propósito: no confirmar si el correo existe o no
    // (evita enumeración de cuentas administrativas).
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(parsed.data.next ?? "/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updatePassword(
  password: string,
): Promise<{ error: string } | null> {
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return null;
}
