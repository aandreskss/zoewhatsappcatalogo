-- Zoe Catalog — 0022: corrige que `user_roles.store_id` no podía ser NULL.
--
-- Bug real descubierto al crear el primer usuario `super_admin` contra un
-- proyecto Supabase real (sección 12/23 del plan): `store_id` se diseñó
-- para admitir NULL ("todas las sucursales" — ver el comentario de
-- `AdminSessionUser.storeId` en `lib/auth/session.ts`), y la columna en sí
-- nunca tuvo un `not null` explícito en 0002_identity_and_access.sql. El
-- problema es que formaba parte de la llave primaria compuesta
-- `primary key (user_id, role_id, store_id)` — en Postgres, TODA columna
-- de una primary key queda forzada a NOT NULL automáticamente, sin
-- importar que la columna en sí no lo declare. Nunca se detectó antes
-- porque nunca hubo una base de datos real contra la cual insertar un rol
-- global (`super_admin`/`admin`, sin sucursal) hasta ahora.
--
-- Solución estándar de Postgres para "columna nullable que igual debe
-- participar en unicidad, tratando NULL como un valor propio": llave
-- primaria sustituta (`id`) + índice único sobre
-- `(user_id, role_id, coalesce(store_id, <uuid centinela>))`, para seguir
-- evitando duplicados exactos (incluida la fila "todas las sucursales"),
-- que un unique constraint normal NO lograría (Postgres trata cada NULL
-- como distinto de cualquier otro NULL en una unique constraint plana).
alter table user_roles drop constraint user_roles_pkey;

alter table user_roles add column id uuid not null default gen_random_uuid();
alter table user_roles add primary key (id);

create unique index uq_user_roles_user_role_store on user_roles (
  user_id,
  role_id,
  coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
