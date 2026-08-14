/**
 * Función unificada de subida de imágenes con fallback automático.
 *
 * 1. Intenta Cloudinary (unsigned, client-side) si las variables están
 *    disponibles en el bundle.
 * 2. Si Cloudinary falla por cualquier razón (NetworkError, CORS, preset
 *    firmado, vars no bakeadas en el build), cae automáticamente al
 *    Route Handler /api/admin/upload → Supabase Storage.
 *
 * El bucket "media" en Supabase Storage debe existir y ser público.
 * Créalo desde: Supabase Dashboard → Storage → New bucket → "media" → Public.
 */

async function uploadViaSupabase(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "Error al subir la imagen al servidor");
  }
  return json.url;
}

export async function uploadImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form },
      );

      if (res.ok) {
        const data = (await res.json()) as { secure_url?: string };
        if (typeof data.secure_url === "string") return data.secure_url;
      }

      // Cloudinary respondió pero con error → intentar Supabase
      console.warn("Cloudinary falló, intentando Supabase Storage como fallback…");
    } catch {
      // NetworkError / CORS / preset firmado → fallback silencioso
      console.warn("Cloudinary no disponible, usando Supabase Storage…");
    }
  }

  return uploadViaSupabase(file);
}
