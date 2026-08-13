/**
 * Layout del grupo de rutas públicas (sección 5/31 del plan).
 *
 * A partir de la Fase 1 (design system) y la Fase 2 (catálogo) aquí vive el
 * Header sticky, el buscador, el menú mobile y el Footer compartidos por
 * todo el sitio público. En la Fase 0 se deja como paso a través para no
 * construir UI antes de tener el design system.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
