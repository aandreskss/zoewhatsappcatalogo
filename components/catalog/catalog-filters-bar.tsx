/**
 * Formulario nativo (method="get", sin JavaScript) que escribe los
 * filtros directamente en la URL — es la persistencia (sección 8/46 del
 * plan): recargar, compartir el enlace o volver atrás conserva los
 * filtros porque viven en `searchParams`, no en estado de React.
 */
export function CatalogFiltersBar({
  current,
}: {
  current: {
    categoria?: string;
    marca?: string;
    q?: string;
    precio_min?: string;
    precio_max?: string;
    orden?: string;
  };
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 text-sm"
    >
      {current.categoria ? (
        <input type="hidden" name="categoria" value={current.categoria} />
      ) : null}
      {current.marca ? <input type="hidden" name="marca" value={current.marca} /> : null}
      {current.q ? <input type="hidden" name="q" value={current.q} /> : null}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="precio_min"
          className="text-xs text-[var(--color-muted-foreground)]"
        >
          Precio mín. (USD)
        </label>
        <input
          id="precio_min"
          name="precio_min"
          type="number"
          min="0"
          step="1"
          defaultValue={current.precio_min}
          className="h-9 w-28 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="precio_max"
          className="text-xs text-[var(--color-muted-foreground)]"
        >
          Precio máx. (USD)
        </label>
        <input
          id="precio_max"
          name="precio_max"
          type="number"
          min="0"
          step="1"
          defaultValue={current.precio_max}
          className="h-9 w-28 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="orden" className="text-xs text-[var(--color-muted-foreground)]">
          Ordenar por
        </label>
        <select
          id="orden"
          name="orden"
          defaultValue={current.orden}
          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
      </div>
      <button
        type="submit"
        className="h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-[var(--color-primary-foreground)]"
      >
        Aplicar
      </button>
    </form>
  );
}
