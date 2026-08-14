"use server";

import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/auth/session";
import { getMfaStatus } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

export interface ChallengeState {
  error: string | null;
}

/**
 * Reto de 2FA en cada nuevo login (sección 23 del plan) — a diferencia
 * del enrolamiento, el factor YA existe y está verificado de una sesión
 * anterior; solo se reta (`challenge`) y se verifica el código actual.
 */
export async function verifyMfaChallenge(
  _prevState: ChallengeState,
  formData: FormData,
): Promise<ChallengeState> {
  const user = await getAdminSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);

  if (!mfa.hasVerifiedFactor || !mfa.verifiedFactorId) {
    redirect("/admin/mfa/enroll");
  }
  if (mfa.isSessionVerified) {
    redirect("/admin");
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { error: "Ingresa el código de 6 dígitos de tu app de autenticación." };
  }

  const rate = checkRateLimit(`mfa-challenge:${user.id}`, 8, 10 * 60_000);
  if (!rate.allowed) {
    return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: mfa.verifiedFactorId,
  });
  if (challengeError || !challenge) {
    return { error: "No se pudo verificar el código. Intenta de nuevo." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: mfa.verifiedFactorId,
    challengeId: challenge.id,
    code,
  });

  if (verifyError) {
    return { error: "Código incorrecto o expirado." };
  }

  redirect("/admin");
}
