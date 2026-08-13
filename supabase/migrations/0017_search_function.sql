-- Zoe Catalog — 0017: búsqueda tolerante a errores tipográficos.
--
-- `pg_trgm` ya estaba habilitado (0001) con un índice GIN sobre
-- `products.name` (0004), pero nada lo usaba todavía — el filtro de
-- búsqueda del catálogo (`ilike`) solo encuentra substrings exactos, no
-- tolera un typo simple como pide la sección 8/22/46 del plan ("la
-- búsqueda tolera al menos un error tipográfico"). Esta función usa
-- `similarity()`/`word_similarity()` de pg_trgm para rankear por
-- parecido y toleral errores de tipeo, con un `ilike` como respaldo para
-- coincidencias exactas de substring que a veces `similarity` puntúa
-- bajo en nombres cortos.
create or replace function search_products(p_query text, p_limit integer default 24)
returns table (product_id uuid, rank real)
language sql
stable
as $$
  select
    p.id as product_id,
    greatest(
      word_similarity(p_query, p.name),
      case when p.name ilike '%' || p_query || '%' then 0.5 else 0 end,
      case when exists (
        select 1 from unnest(p.tags) t where t ilike '%' || p_query || '%'
      ) then 0.4 else 0 end
    ) as rank
  from products p
  where p.status = 'published'
    and p.deleted_at is null
    and (
      word_similarity(p_query, p.name) > 0.25
      or p.name ilike '%' || p_query || '%'
      or exists (select 1 from unnest(p.tags) t where t ilike '%' || p_query || '%')
    )
  order by rank desc
  limit p_limit;
$$;

-- Autocomplete (sugerencias mientras el cliente escribe): mismo criterio
-- pero con un límite bajo y sin exponerse a full-text pesado — se llama
-- con cada tecla (debounced en el cliente), así que debe ser barata.
create or replace function suggest_products(p_query text, p_limit integer default 6)
returns table (product_id uuid, rank real)
language sql
stable
as $$
  select product_id, rank from search_products(p_query, p_limit);
$$;

-- Ambas funciones solo hacen SELECT sobre catálogo ya público (mismo dato
-- que `public_read_products_published` ya expone) — se otorga ejecución
-- explícita a anon/authenticated en vez de confiar en el default de
-- Postgres, siguiendo la práctica recomendada de Supabase.
grant execute on function search_products(text, integer) to anon, authenticated;
grant execute on function suggest_products(text, integer) to anon, authenticated;

