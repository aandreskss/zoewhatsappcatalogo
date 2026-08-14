import Link from "next/link";

function buildHref(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...override };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return `/catalogo${qs ? `?${qs}` : ""}`;
}

export function CatalogFiltersBar({
  current,
  categories,
}: {
  current: {
    categoria?: string;
    marca?: string;
    q?: string;
    precio_min?: string;
    precio_max?: string;
    orden?: string;
  };
  categories: { name: string; slug: string }[];
}) {
  const base = { q: current.q, orden: current.orden };

  return (
    <div className="flex flex-col gap-3">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href={buildHref(base, { categoria: undefined })}
          className={[
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !current.categoria
              ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
              : "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)]",
          ].join(" ")}
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={buildHref(base, { categoria: cat.slug })}
            className={[
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              current.categoria === cat.slug
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)]",
            ].join(" ")}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Sort row */}
      <form method="get" className="flex items-center gap-2">
        {current.categoria && (
          <input type="hidden" name="categoria" value={current.categoria} />
        )}
        {current.q && <input type="hidden" name="q" value={current.q} />}

        <select
          name="orden"
          defaultValue={current.orden ?? "recientes"}
          className="h-8 rounded-full border border-[var(--color-border)] bg-transparent px-3 text-xs text-[var(--color-muted-foreground)] appearance-none cursor-pointer focus:outline-none"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
        <button
          type="submit"
          className="h-8 rounded-full border border-[var(--color-border)] px-3 text-xs text-[var(--color-muted-foreground)] hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          Ordenar
        </button>

        {(current.categoria || current.marca || current.q || current.precio_min || current.precio_max) && (
          <Link
            href="/catalogo"
            className="ml-auto text-xs text-[var(--color-muted-foreground)] underline hover:text-[var(--color-foreground)]"
          >
            Limpiar filtros
          </Link>
        )}
      </form>
    </div>
  );
}
