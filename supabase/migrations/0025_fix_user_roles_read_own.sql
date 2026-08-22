-- Zoe Catalog — 0025: permite que cada usuario autenticado lea sus propias
-- filas en `user_roles`.
--
-- Bug: la única policy existente en `user_roles` es
-- `super_admin_manage_user_roles` (FOR ALL, solo super_admin). Esto
-- significa que cuando `getAdminSessionUser()` hace SELECT en `user_roles`
-- con el cliente normal (sujeto a RLS), un usuario con rol `admin`,
-- `inventory` o `sales` no puede leer sus propias filas — devuelve vacío,
-- por lo que `user.roles` queda `[]` y cualquier Server Action falla con
-- FORBIDDEN ("Algo salió mal en el panel").
--
-- Solución: policy de SELECT mínima que solo expone la fila propia.
-- La policy de gestión completa (INSERT/UPDATE/DELETE para todos) sigue
-- siendo exclusiva de `super_admin`.

create policy "user_read_own_roles" on user_roles
  for select using (user_id = auth.uid());
