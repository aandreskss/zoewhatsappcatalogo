# Testing — Zoe Catalog

Estrategia real (sección 33 del plan), no un placeholder. Dos niveles, con una limitación honesta documentada abajo.

## Unit tests (Vitest) — `tests/unit/`

Cubren exactamente lo que la sección 33 pide como "Unit": reglas de pricing, construcción del mensaje de WhatsApp (placeholders/sanitización), cálculo de disponibilidad, más los módulos puros añadidos en la Fase 1 (`order-status`, `theme`). Todos los archivos bajo prueba son funciones puras en `lib/domain/*-shared.ts` o similares — sin Next.js, sin red, sin Supabase — por diseño (ver el comentario en cada uno de esos archivos).

```bash
npm test          # corre una vez
npm run test:watch
```

45 tests, deben pasar siempre en cualquier entorno (no dependen de credenciales ni de red).

**Lo que NO cubren estos tests** (y por qué):

- **Generación de ID de pedido** (`next_order_number()`) — es una función de Postgres (`0002_identity_and_access.sql`), no TypeScript. Se prueba con un test de integración contra una base de datos real, no aquí.
- **Checkout completo / idempotencia / reserva de stock con locking** — viven en `create_order()` (función SQL, `0014_create_order_function.sql`) más `lib/domain/orders.ts`, que habla con Supabase en cada paso. Un mock de `SupabaseClient` que simule correctamente `.select().eq().single()` encadenado, RPCs y errores de Postgres (código `23505`, mensajes de `INSUFFICIENT_STOCK`) sería casi tan complejo como el cliente real y frágil ante cualquier cambio de query — el valor real de este test solo aparece corriéndolo contra una instancia Postgres de verdad (local vía `supabase start`, o un proyecto Supabase de "pruebas").

## E2E (Playwright) — `tests/e2e/`

`shopping-flow.spec.ts` (Home → Catálogo → Producto → Carrito → Checkout, búsqueda, filtros) y `admin-flow.spec.ts` (login, crear producto, pedidos, dashboard) están escritos y listos, pero **no se pudieron ejecutar en este sandbox**: `playwright.config.ts` arranca el servidor con `npm run dev`, que a su vez necesita `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` reales — este entorno nunca tuvo un proyecto Supabase vinculado (mismo motivo por el que `next build` tampoco corrió aquí, ver `docs/zoe-catalog-plan.md` y la memoria del proyecto).

Para correrlos de verdad, con `.env.local` completo y el seed aplicado:

```bash
npx playwright install chromium   # una vez, descarga el navegador
npm run db:seed                   # asegura productos/variantes/stock demo
npm run test:e2e
```

`admin-flow.spec.ts` además necesita `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` de un usuario admin real ya creado en Supabase Auth con rol asignado — sin esas variables, ese archivo se salta solo (`test.skip`) en vez de fallar de forma confusa.

## Qué falta si se quiere ampliar

- Integración real contra Postgres (Vitest + `supabase start` local, o un proyecto de pruebas dedicado) para `create_order`, `reserve_inventory_for_order`, `release_expired_reservations`.
- Los casos especiales de la sección 33 (talla se agota durante el checkout con dos pestañas, doble clic en "Enviar pedido", WhatsApp no abre) son escenarios de carrera/UI que se prestan mejor a Playwright con dos contextos de navegador en paralelo — no están escritos todavía, quedan como próximo paso natural sobre esta base.
