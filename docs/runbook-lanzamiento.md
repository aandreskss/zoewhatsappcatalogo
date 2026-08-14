# Runbook de lanzamiento — Zoe Catalog

Este documento cubre lo que el equipo humano debe hacer para llevar Zoe
Catalog de "código en un repositorio" a "sitio en producción con
observabilidad real". Nada de esto se pudo ejecutar durante el desarrollo
en este sandbox porque requiere cuentas y credenciales que no existen
aquí (Supabase, Vercel, Sentry, un uptime monitor) — ver también
`tests/README.md` sobre por qué `next build` tampoco se pudo correr. Lo
que sí existe es todo el código que espera estas piezas: rutas,
variables de entorno, tablas y RLS ya escritas y (donde se pudo)
probadas con `vitest`.

Sigue las secciones en orden: cada una depende de la anterior.

## 1. Supabase (proyecto real)

1. Crea un proyecto en [supabase.com](https://supabase.com) (o usa uno ya
   existente reservado para Zoe).
2. Vincúlalo con la CLI: `supabase link --project-ref <ref>`.
3. Aplica todas las migraciones versionadas en `supabase/migrations/`
   (0001 a 0021 al momento de escribir esto):
   ```bash
   npm run db:migrate
   ```
   Nunca edites el esquema a mano desde el Studio de Supabase en
   producción — cualquier cambio de esquema nuevo debe ser una migración
   nueva en el repositorio, igual que las 21 que ya existen.
4. (Opcional, para probar con datos de ejemplo antes de cargar catálogo
   real) `npm run db:seed`. **No correr contra producción** una vez que
   haya pedidos reales — el seed es para desarrollo/staging.
5. Copia `Project Settings → API` → `Project URL`, `anon public key` y
   `service_role key`. La `service_role key` es un secreto: solo va en
   variables de entorno de servidor, nunca en el navegador, nunca
   commiteada.
6. Crea el primer usuario administrador desde `Authentication → Add
user` (nunca insertando una fila en una tabla de contraseñas propia —
   este proyecto no tiene una), y asígnale `super_admin`:
   ```sql
   insert into user_roles (user_id, role_id)
   select '<uuid-del-usuario>', id from roles where name = 'super_admin';
   ```
7. Configura Storage (bucket de imágenes de producto) si aún no existe —
   ver sección 8 de `docs/zoe-catalog-plan.md` para el nombre/estructura
   esperada por `lib/db/supabase/*` y `next.config.ts`
   (`images.remotePatterns` ya apunta a `*.supabase.co`).

## 2. Variables de entorno

Completa `.env.local` (desarrollo) y las variables de entorno del
proyecto en Vercel (producción/preview) a partir de `.env.example`:

| Variable                                  | De dónde sale                                                 |
| ----------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                    | El dominio real una vez asignado (paso 3)                     |
| `NEXT_PUBLIC_SUPABASE_URL`                | Supabase → Project Settings → API                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`           | Supabase → Project Settings → API                             |
| `SUPABASE_SERVICE_ROLE_KEY`               | Supabase → Project Settings → API (secreto)                   |
| `CRON_SECRET`                             | Generar un valor aleatorio largo (ej. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_GA4_ID` / `GTM_ID` / pixeles | Cuentas de analítica (sección 9 del plan) — opcionales        |
| `SENTRY_DSN`                              | Ver sección 4 de este runbook — opcional                      |

`CRON_SECRET` debe coincidir con lo que Vercel Cron manda automáticamente
como `Authorization: Bearer <CRON_SECRET>` a `/api/cron/*` (ver
`vercel.json`) — Vercel hace esto solo si la variable de entorno
`CRON_SECRET` existe en el proyecto, no hay que configurarlo aparte en
la UI de Cron.

## 3. Vercel (o el host que se use)

1. Importa el repositorio.
2. Carga las variables de entorno de la sección 2.
3. Confirma que `vercel.json` (ya en el repo) registra los dos cron jobs
   (`release-reservations` cada 5 min, `refresh-exchange-rates` cada 2h)
   — Vercel los activa solo al detectar el archivo, no hay paso manual
   adicional.
4. Asigna el dominio real y actualiza `NEXT_PUBLIC_SITE_URL` para que
   coincida (lo usan `app/sitemap.ts`, JSON-LD y los enlaces absolutos de
   WhatsApp).
5. Primer deploy. Antes de anunciar la tienda, corre el checklist de la
   sección 6.

## 4. Sentry (opcional)

El código ya tiene el enganche listo pero **inerte por defecto**
(`lib/observability/error-reporting.ts`) — no se instaló `@sentry/nextjs`
como dependencia porque no hay forma de verificar esa integración sin un
DSN real y sin poder correr `next build` en este sandbox. Para activarlo:

1. Crea un proyecto en [sentry.io](https://sentry.io) (tipo "Next.js").
2. Instala el paquete:
   ```bash
   npm install @sentry/nextjs
   ```
3. Corre el wizard oficial (genera `sentry.server.config.ts`,
   `sentry.client.config.ts`, `instrumentation.ts` y envuelve
   `next.config.ts` con `withSentryConfig`):
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
4. Define `SENTRY_DSN` en las variables de entorno (sección 2). En cuanto
   esa variable exista Y el paquete esté instalado,
   `lib/observability/error-reporting.ts` empieza a mandarle todo lo que
   ya captura `reportError` (errores de servidor y los que suben los
   `error.tsx` del cliente vía `/api/log-client-error`) — sin tocar el
   resto del código.
5. Si `SENTRY_DSN` está puesta pero el paquete no se instaló, el sistema
   sigue funcionando (se degrada a logging estructurado normal) y deja
   una advertencia una sola vez en los logs recordando este paso.

Sin Sentry, el panel `/admin/salud` (ver sección 7) sigue mostrando
errores recientes igual — se guardan en la tabla `error_reports`
independientemente de Sentry.

## 5. Uptime monitor externo

El endpoint `GET /api/health` (sin autenticación, sin datos sensibles) ya
existe y hace una lectura mínima a la base de datos:

- `200` + `{"ok": true, "checks": {"database": "ok"}, ...}` — todo bien.
- `503` + `{"ok": false, "checks": {"database": "error"}, ...}` — el
  proceso responde pero no puede hablar con Supabase.

Configura cualquier servicio de uptime monitoring (UptimeRobot, Better
Uptime, Checkly, el que ya use el negocio) para pegarle a
`https://<tu-dominio>/api/health` cada 1-5 minutos y alertar por
correo/WhatsApp/Slack cuando el status no sea `200`. Esto es
intencionalmente independiente de Sentry: cubre "el sitio está caído",
que Sentry (pensado para excepciones de código) no siempre detecta si el
proceso ni siquiera arranca.

## 6. Checklist antes de anunciar la tienda

- [ ] `npm run db:migrate` corrido contra el proyecto de producción, sin
      errores.
- [ ] Login de super_admin funciona y **pide activar 2FA** la primera vez
      (`/admin/mfa/enroll`) — confirma con Google Authenticator/Authy real,
      no solo que la pantalla cargue.
- [ ] Catálogo, precios, inventario y métodos de pago/entrega cargados
      con datos reales de Zoe (no el seed de desarrollo).
- [ ] Un pedido de prueba de punta a punta: agregar al carrito → checkout
      → el enlace de WhatsApp abre con el mensaje correcto → el pedido
      aparece en `/admin/pedidos`.
- [ ] `GET /api/health` responde `200` con `checks.database: "ok"`.
- [ ] `/admin/salud` (Super Admin) muestra los dos cron jobs "Al día"
      después de esperar un ciclo completo de cada uno (5 min y 2h).
- [ ] Uptime monitor externo configurado y probado (fuerza un falso
      positivo bajando el sitio un momento, si es posible, para confirmar
      que la alerta llega).
- [ ] Variables de entorno de analítica (GA4/Meta/TikTok) puestas si el
      negocio las va a usar desde el día uno — son opcionales, el sitio
      funciona sin ellas.

## 7. Operación diaria

- `/admin/salud` (Super Admin) — estado de los cron jobs y errores
  recientes, sin salir del panel admin. Si un job aparece "Atrasado / con
  errores": revisa `CRON_SECRET` (¿coincide en Vercel y en el proyecto?),
  revisa los logs de la función en Vercel para ese cron, y si el job es
  `refresh-exchange-rates`, revisa también `exchange_rate_fetch_logs` en
  Supabase para ver si el proveedor de tasas (DolarApi) está caído.
- `/admin/seguridad` — cualquier usuario puede ver si tiene 2FA activo y
  restablecerlo (requiere haber pasado el segundo factor en la sesión
  actual). Si alguien pierde el dispositivo Y no puede iniciar sesión
  para restablecerlo desde ahí, la única salida es un Super Admin (o
  quien tenga acceso al dashboard de Supabase) eliminando manualmente el
  factor desde `Authentication → Users → <usuario> → MFA` en Supabase.
- Rotación de secretos: si `SUPABASE_SERVICE_ROLE_KEY` o `CRON_SECRET` se
  filtran, rótalos de inmediato (Supabase dashboard / generar uno nuevo)
  y actualiza las variables de entorno en Vercel — un redeploy las toma
  al vuelo.
