-- Zoe Catalog — 0018: lectura pública de integraciones de analítica.
--
-- Mismo patrón de bug que 0015/0016: el sitio público necesita leer con
-- la clave anon qué integraciones de analítica (GA4/GTM/Meta
-- Pixel/TikTok) están activas y su `public_config` (measurement/pixel
-- id) para inyectar los scripts correspondientes (sección 21/26 del
-- plan) — y `0012_row_level_security.sql` solo agregó política de
-- administración para `integrations`, ninguna de lectura pública.
--
-- Se acota explícitamente a los proveedores que SÍ se cargan del lado
-- del navegador (sus IDs son públicos por definición: cualquiera los ve
-- en el HTML/JS servido). `meta_capi`, `google_ads` y `bcv_rate_provider`
-- quedan fuera a propósito — nunca se cargan en el cliente, y
-- `secret_ref` en cualquier caso solo guarda el NOMBRE de una variable de
-- entorno, nunca el secreto real (ver comentario en 0010).
create policy "public_read_client_side_integrations" on integrations
  for select using (
    active = true and provider in ('ga4', 'gtm', 'meta_pixel', 'tiktok')
  );
