import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type === "recovery") {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });

    if (!error) {
      return NextResponse.redirect(new URL("/admin/reset-password", request.url));
    }
  }

  // Token inválido o expirado → volver al login con error
  return NextResponse.redirect(
    new URL("/admin/login?error=link_invalido", request.url),
  );
}
