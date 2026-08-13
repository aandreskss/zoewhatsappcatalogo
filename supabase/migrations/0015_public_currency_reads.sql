-- Zoe Catalog — 0015: lectura pública de tasa de cambio y config pública.
--
-- Bug descubierto al iniciar la Fase 6: las páginas públicas (catálogo,
-- producto) leen la tasa vigente y `company_settings.ves_reference_currency`
-- usando el cliente con la clave anon (`createSupabaseServerClient`, que
-- respeta RLS) — pero `0012_row_level_security.sql` nunca agregó una
-- policy de SELECT pública para `exchange_rates` ni `company_settings`,
-- solo policies de administración. Resultado: para cualquier visitante
-- anónimo, `getVesReferenceRate`/`getActiveExchangeRate` devolvían null en
-- silencio (RLS bloqueaba la fila) y el precio en Bs nunca se mostraba —
-- contradiciendo la decisión de negocio confirmada de "USD y Bs siempre
-- visibles" (sección 15 del plan). Nunca se notó porque nada fallaba con
-- error, el catálogo simplemente se degradaba a "solo USD" en silencio.
--
-- `exchange_rates` no es información sensible — por definición es la tasa
-- que se le muestra a cualquiera. `company_settings` es una tabla
-- key/value con configuración interna variada (algunas claves sí
-- deberían quedar privadas a futuro), así que se acota la lectura pública
-- explícitamente a las claves que son intrínsecamente públicas hoy, en
-- vez de abrir toda la tabla.
create policy "public_read_exchange_rates" on exchange_rates
  for select using (true);

create policy "public_read_company_settings_public_keys" on company_settings
  for select using (
    key in (
      'ves_reference_currency',
      'price_display_mode',
      'stock_visibility_mode',
      'whatsapp_routing_strategy'
    )
  );
