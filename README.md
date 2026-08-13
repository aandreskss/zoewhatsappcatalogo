# Zoe Catalog

Catálogo digital + carrito + checkout que registra pedidos verificados en
servidor y los entrega por WhatsApp para que un vendedor cierre la venta.

El plan funcional/técnico completo (producto, arquitectura, modelo de
datos, roadmap, MVP) vive en [`docs/zoe-catalog-plan.md`](./docs/zoe-catalog-plan.md).
Este README cubre solo lo operativo: cómo levantar el proyecto.

## Stack

Next.js (App Router) + TypeScript estricto, Tailwind CSS v4, componentes
propios estilo shadcn/ui, Supabase (Postgres + Auth + Storage), Zod para
validación compartida frontend/backend.

## Requisitos

- Node.js ≥ 20
- Una cuenta/proyecto de [Supabase](https://supabase.com) (o Supabase CLI +
  Docker para desarrollo 100% local)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
```

Completa en `.env.local` al menos:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
  Settings → API en el dashboard de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — misma pantalla. **Nunca** se expone al
  cliente ni se commitea.

### Base de datos

Las migraciones en `supabase/migrations/` son la única fuente de verdad del
esquema — nunca se modifica una base de datos de Supabase a mano desde el
Studio en producción.

```bash
# Contra un proyecto remoto ya vinculado (`supabase link`):
npm run db:migrate

# Contra Supabase local (requiere Docker + `supabase start`):
npm run db:migrate:local
npm run db:seed
```

`supabase/seed/seed.sql` crea la empresa Zoe, las 2 sucursales, categorías,
métodos de pago/entrega, la plantilla de WhatsApp y un producto de
ejemplo con variantes e inventario — es idempotente, se puede correr más
de una vez.

**El primer usuario administrador se crea desde Supabase Auth** (dashboard
→ Authentication → Add user, o `supabase auth admin`), nunca insertando
directamente en una tabla de contraseñas propia. Una vez creado, asígnale
el rol `super_admin`:

```sql
insert into user_roles (user_id, role_id)
select '<uuid-del-usuario>', id from roles where name = 'super_admin';
```

### Desarrollo

```bash
npm run dev
```

- Sitio público: `http://localhost:3000`
- Panel admin: `http://localhost:3000/admin/login`

### Scripts

| Script                                    | Qué hace                             |
| ----------------------------------------- | ------------------------------------ |
| `npm run dev`                             | Servidor de desarrollo               |
| `npm run build` / `npm run start`         | Build y arranque de producción       |
| `npm run typecheck`                       | `tsc --noEmit` (TypeScript estricto) |
| `npm run lint`                            | ESLint                               |
| `npm run format` / `format:check`         | Prettier                             |
| `npm run db:migrate` / `db:migrate:local` | Aplica migraciones (remoto/local)    |
| `npm run db:seed`                         | Carga datos demo                     |

## Estructura del proyecto

Ver sección 31 del plan para el razonamiento completo. Resumen:

```
app/(public)/     rutas públicas del catálogo
app/admin/        dashboard (login fuera del auth-gate, resto protegido)
app/api/          Route Handlers públicos
components/ui/    primitivos genéricos del design system (sin lógica de negocio)
components/admin/ componentes exclusivos del dashboard
lib/domain/       lógica de negocio pura (pricing, inventario, pedidos) — sin imports de Next.js
lib/db/supabase/  clientes de Supabase (browser, server, service role)
lib/auth/         sesión, roles, Server Actions de login/logout
lib/validation/   schemas Zod compartidos
supabase/migrations/  esquema versionado (única fuente de verdad de la DB)
supabase/seed/    datos demo
tests/            unit / integration / e2e
```

## Seguridad — reglas que no se negocian

- El frontend nunca es fuente de verdad: precio, stock, rol y total
  siempre se recalculan en servidor antes de crear un pedido.
- Row Level Security está activo en toda tabla de negocio
  (`supabase/migrations/0012_row_level_security.sql`). La clave `anon`
  solo lee catálogo publicado; toda escritura del sitio público pasa por
  Route Handlers con la Service Role Key, después de validar todo en
  código de servidor.
- `SUPABASE_SERVICE_ROLE_KEY` es un secreto de servidor. Si se filtra, hay
  que rotarla desde el dashboard de Supabase de inmediato.

## Roadmap

El orden de implementación completo (Fase 0 a Fase 12) está en la sección
41 de `docs/zoe-catalog-plan.md`. Estado actual: Fase 0 completa
(fundaciones, modelo de datos, autenticación admin).
