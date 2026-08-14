/**
 * Subida de imágenes directo desde el navegador a Cloudinary (unsigned
 * upload) — decisión del usuario de usar Cloudinary como hosting de
 * imágenes de producto. "Unsigned" significa que el navegador sube el
 * archivo directo a Cloudinary usando un upload preset preconfigurado en
 * modo "Unsigned" desde el dashboard de Cloudinary — no requiere guardar
 * ningún secreto en el servidor, a cambio de que cualquiera con el cloud
 * name + nombre del preset pueda subir imágenes a esa cuenta. Aceptable
 * para este caso de uso (admin panel con su propia auth), siempre que el
 * preset tenga límites de tamaño/formato configurados desde Cloudinary
 * (ver docs/runbook-lanzamiento.md, sección de Cloudinary).
 *
 * Sin `import "server-only"` a propósito: este módulo corre en el
 * navegador, importado desde un Client Component del admin.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** El botón de subida solo se muestra si ambas variables están configuradas — si no, el admin sigue pudiendo pegar una URL a mano. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary no está configurado (faltan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Cloudinary rechazó la imagen (revisa tamaño/formato del archivo).");
  }

  const data: unknown = await response.json();
  const secureUrl = (data as { secure_url?: unknown }).secure_url;
  if (typeof secureUrl !== "string") {
    throw new Error("Respuesta inesperada de Cloudinary.");
  }

  return secureUrl;
}
