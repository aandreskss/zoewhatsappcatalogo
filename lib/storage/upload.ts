/**
 * Función unificada de subida de imágenes.
 *
 * Prioridad:
 * 1. Cloudinary (unsigned upload, client-side) — si están configuradas
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 * 2. Supabase Storage (via Route Handler /api/admin/upload) — fallback
 *    cuando Cloudinary no está configurado. Requiere bucket "media" público
 *    en el dashboard de Supabase Storage.
 */
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary/upload";

export async function uploadImage(file: File): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadImageToCloudinary(file);
  }

  // Fallback: Supabase Storage vía API route
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "Error al subir la imagen");
  }
  return json.url;
}
