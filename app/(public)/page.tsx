/**
 * Home pública — placeholder de la Fase 0.
 *
 * El Home real (hero administrable, categorías visuales, secciones
 * dinámicas) se construye en la Fase 7 sobre el catálogo de la Fase 2. Esta
 * página solo confirma que el proyecto arrancó correctamente.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Zoe Shoes</h1>
      <p className="max-w-md text-[var(--color-muted-foreground)]">
        El catálogo está en construcción. Fase 0 (fundaciones) completada — el Home real
        llega en una fase posterior del roadmap.
      </p>
    </main>
  );
}
