"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

/**
 * Autocomplete tolerante a errores (sección 46 del plan): debounce corto
 * + `/api/search/suggest` (que a su vez usa `search_products`/pg_trgm).
 * Enter o clic en "ver todos" navega a `/buscar?q=` para la búsqueda
 * completa y su registro en `search_logs`.
 */
export function SearchBox() {
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // El reset a [] cuando el texto es muy corto se hace en el `onChange`
  // (un event handler, no un efecto) — llamar setState de forma síncrona
  // dentro del cuerpo de un efecto dispara renders en cascada que el
  // linter de react-hooks marca como error; el fetch debounced sí es un
  // caso legítimo de efecto porque su setState ocurre en un callback
  // asíncrono (`.then`), no de forma síncrona.
  React.useEffect(() => {
    if (query.trim().length < 2) return;
    const timeout = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data: { suggestions: Suggestion[] }) => setSuggestions(data.suggestions))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearch() {
    if (query.trim().length === 0) return;
    setIsOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          goToSearch();
        }}
        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2"
      >
        <Search className="size-4 text-[var(--color-muted-foreground)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setIsOpen(true);
            if (next.trim().length < 2) setSuggestions([]);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar zapatos…"
          className="h-9 w-full bg-transparent text-sm outline-none"
        />
      </form>

      {isOpen && suggestions.length > 0 ? (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-lg">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/producto/${suggestion.slug}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2 text-sm hover:bg-[var(--color-muted)]"
            >
              <div className="relative size-8 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-muted)]">
                {suggestion.imageUrl ? (
                  <Image src={suggestion.imageUrl} alt="" fill className="object-cover" />
                ) : null}
              </div>
              {suggestion.name}
            </Link>
          ))}
          <button
            type="button"
            onClick={goToSearch}
            className="w-full border-t border-[var(--color-border)] p-2 text-left text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            Ver todos los resultados para &ldquo;{query}&rdquo;
          </button>
        </div>
      ) : null}
    </div>
  );
}
