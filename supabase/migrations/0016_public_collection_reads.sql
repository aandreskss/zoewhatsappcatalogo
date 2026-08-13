-- Zoe Catalog — 0016: lectura pública de `collection_products`.
--
-- Necesaria para la Fase 7 (Home administrable): un bloque del Home tipo
-- `collection` o un slider de tipo "colección" necesita poder leer qué
-- productos pertenecen a una colección activa usando la clave anon —
-- `0012_row_level_security.sql` habilitó RLS y agregó lectura pública de
-- `collections`, pero se olvidó la tabla puente `collection_products`
-- (mismo patrón de bug que 0015 con `exchange_rates`/`company_settings`).
create policy "public_read_collection_products" on collection_products
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_products.collection_id and c.active = true
    )
  );
