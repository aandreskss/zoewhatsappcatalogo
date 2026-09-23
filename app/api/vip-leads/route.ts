import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  name:  z.string().trim().min(2, "Ingresa tu nombre").max(100),
  phone: z.string().trim().min(7, "Ingresa un teléfono válido").max(30),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`vip-lead:${ip}`, 3, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { name, phone, email } = parsed.data;
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("vip_leads").insert({
    name,
    phone,
    email: email || null,
    source: "home_form",
  });

  if (error) {
    console.error("[api/vip-leads]", error.message);
    return NextResponse.json({ error: "No se pudo registrar. Intenta de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
