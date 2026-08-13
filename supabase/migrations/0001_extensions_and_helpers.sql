-- Zoe Catalog — 0001: extensiones y helpers compartidos
-- Ver docs/zoe-catalog-plan.md sección 12 para el modelo completo.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- búsqueda tolerante a errores (sección 12/22 del plan)

-- Mantiene `updated_at` correcto sin depender de que cada UPDATE lo recuerde
-- hacer a mano (regla: normalizar datos, no confiar en la aplicación para
-- invariantes que la base de datos puede garantizar sola).
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Trigger BEFORE UPDATE que refresca updated_at automáticamente.';
