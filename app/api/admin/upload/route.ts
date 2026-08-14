import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";

const BUCKET = "media";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(request: Request) {
  // 1. Auth — solo admins autenticados
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Parsear multipart
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  // 3. Validaciones
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa JPG, PNG, WEBP, GIF o AVIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 10 MB." }, { status: 400 });
  }

  // 4. Nombre único para evitar colisiones
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `uploads/${slug}`;

  // 5. Subir con service role (bypasa RLS del bucket)
  const service = createSupabaseServiceRoleClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    // Si el bucket no existe, dar instrucción clara
    if (uploadError.message.includes("bucket") || uploadError.message.includes("not found")) {
      return NextResponse.json(
        {
          error:
            'El bucket "media" no existe en Supabase Storage. Créalo desde el dashboard: Storage → New bucket → nombre "media" → Public.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 6. URL pública
  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
