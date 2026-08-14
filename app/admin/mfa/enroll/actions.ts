"use server";

import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/session";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

/**
 * 2FA (sección 23 del plan) — enrolamiento vía TOTP nativo de Supabase
 * Auth, en dos pasos separados porque el primero no depende de ningún
 * input del usuario (solo de que la pantalla se haya montado) y el
 * segundo sí (el código de 6 dígitos).
 */
export type EnrollStartResult =
  | { ok: true; factorId: string; qrCodeSvg: string; secret: string }
  | { ok: false; error: string };

/**
 * Paso 1: crea un factor TOTP nuevo y devuelve el QR/clave para agregarlo
 * a una app de autenticación (Google Authenticator, Authy, 1Password...).
 * Se invoca directamente desde el cliente (no es la acción de un
 * `<form>`) porque no depende de ningún dato que el usuario ingrese.
 */
export async function startMfaEnrollment(): Promise<EnrollStartResult> {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }

  const supabase = await createSupabaseServerClient();

  // Usa el cliente admin para obtener todos los factores del usuario (incluyendo
  // los no verificados, que el cliente regular a veces no devuelve en sesión AAL1).
  const adminSupabase = createSupabaseServiceRoleClient();
  const { data: userData } = await adminSupabase.auth.admin.getUserById(user.id);
  const allFactors = userData?.user?.factors ?? [];
  const unverifiedTotp = allFactors.filter(
    (f) => f.factor_type === "totp" && f.status !== "verified",
  );
  await Promise.all(unverifiedTotp.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `${user.email ?? "admin"}-${Date.now()}`,
  });

  if (error || !data) {
    return {
      ok: false,
      error: "No se pudo iniciar el enrolamiento de 2FA. Intenta de nuevo.",
    };
  }

  return {
    ok: true,
    factorId: data.id,
    qrCodeSvg: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export interface VerifyEnrollState {
  error: string | null;
}

/**
 * Paso 2: el usuario ingresa el código de 6 dígitos generado por su app.
 * Si `challenge` + `verify` tienen éxito, Supabase marca el factor como
 * verificado y sube la sesión actual a `aal2` — después de esto,
 * `(protected)/layout.tsx` deja pasar sin pedir más pantallas de 2FA.
 */
export async function verifyMfaEnrollment(
  _prevState: VerifyEnrollState,
  formData: FormData,
): Promise<VerifyEnrollState> {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }

  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (!factorId || !/^\d{6}$/.test(code)) {
    return { error: "Ingresa el código de 6 dígitos de tu app de autenticación." };
  }

  // Rate limit por usuario (sección 23 del plan) — defensa adicional
  // contra fuerza bruta sobre el código de 6 dígitos, además de lo que
  // Supabase ya limite del lado de GoTrue.
  const rate = checkRateLimit(`mfa-enroll-verify:${user.id}`, 8, 10 * 60_000);
  if (!rate.allowed) {
    return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return { error: "No se pudo verificar el código. Intenta de nuevo." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (verifyError) {
    return {
      error:
        "Código incorrecto o expirado. Verifica la hora de tu dispositivo e intenta de nuevo.",
    };
  }

  redirect("/admin");
}
