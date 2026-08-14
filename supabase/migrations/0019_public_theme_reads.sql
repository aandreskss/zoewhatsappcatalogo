-- Zoe Catalog — 0019: lectura pública del theme activo.
-- Sección 28 del plan (tokens editables desde Apariencia/Branding).
--
-- Mismo patrón de bug ya visto tres veces en Fases 6-9 (0015/0016/0018):
-- `themes` solo tenía policies de administración (`admin_read_themes`,
-- `super_admin_manage_themes`), pero el layout público necesita leer el
-- theme activo con la clave anónima para inyectar sus tokens — sin esta
-- policy, `getActiveTheme()` siempre devuelve null y el sitio se queda
-- silenciosamente en los tokens por defecto de `globals.css` (no es un
-- bug visible con error, solo "el branding nunca se aplica").
create policy "public_read_active_theme" on themes
  for select using (is_active = true);
