/**
 * Slugs no son IDs (regla permanente): son una propiedad de SEO/URL. Estas
 * funciones solo generan el texto — la unicidad real se garantiza con el
 * `unique` constraint en base de datos más un reintento con sufijo.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Dado un slug base y una lista de slugs ya existentes, devuelve uno único
 * agregando -2, -3, etc. — usado en el servidor antes del INSERT, nunca
 * confiando en que el cliente calculó bien la unicidad.
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
  return candidate;
}
