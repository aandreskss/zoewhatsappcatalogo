/**
 * Normalización de teléfono venezolano/internacional a E.164 (regla
 * permanente: normalizar datos antes de guardar, especial atención a
 * teléfono). Por defecto asume Venezuela (+58) si el usuario escribió un
 * número local de 10 dígitos empezando en 0 (ej. "0412..."), pero acepta
 * cualquier número internacional si ya trae el prefijo "+".
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();

  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  // '0412xxxxxxx' (11 dígitos, empieza en 0) → +58 412xxxxxxx
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return "+58" + digitsOnly.slice(1);
  }

  // '412xxxxxxx' (10 dígitos) → +58 412xxxxxxx
  if (digitsOnly.length === 10) {
    return "+58" + digitsOnly;
  }

  return "+" + digitsOnly;
}
