# Zoe Catalog — instrucciones para Claude Code

## Stack

- **Next.js 16** App Router · TypeScript estricto · Tailwind CSS v4
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Zod** para validación en servidor · shadcn/ui como base de componentes UI

## Comandos clave

```bash
npm run dev          # desarrollo (puerto 3000)
npm run typecheck    # tsc --noEmit — correr siempre antes de pushear
npm run lint         # ESLint
npm run build        # build de producción (igual que Vercel)
```

## Tokens de diseño (brand)

| Token          | Valor     | Uso                          |
|----------------|-----------|------------------------------|
| Wine/Primary   | `#7B1847` | CTAs, acentos, activos       |
| Ink            | `#29252A` | Texto principal              |
| Cream          | `#FDF8FB` | Fondo general del admin      |
| Border         | `#EBE0E7` | Bordes de cards y tablas     |
| Mauve          | `#F0D8E8` | Fondos secundarios           |
| Rose-light     | `#F0B8D0` | Acentos suaves               |

Todos los componentes del admin usan estos valores directamente con Tailwind (e.g., `bg-[#7B1847]`), **no** variables CSS.

## Estructura del proyecto

```
app/(public)/          catálogo público (ISR habilitado)
app/admin/             panel admin — login fuera del auth-gate
  (protected)/         rutas protegidas; layout requiere sesión + rol
app/api/               Route Handlers públicos
components/ui/         primitivos genéricos (sin lógica de negocio)
components/admin/      componentes exclusivos del panel
lib/domain/            lógica de negocio pura (sin imports de Next.js)
lib/db/supabase/       clientes de Supabase: browser / server / service-role
lib/auth/              sesión, roles, Server Actions de login/logout
lib/validation/        schemas Zod compartidos
supabase/migrations/   esquema versionado — única fuente de verdad de la DB
```

## Reglas que no se negocian

### Tipos de Supabase (`lib/db/supabase/types.ts`)
Los tipos son **manuales**, no auto-generados. Cuando se agrega un campo a la DB (migration) hay que actualizarlo a mano. Lugares a revisar siempre:
- `lib/db/supabase/types.ts` — tabla `integrations.Row.provider` y cualquier tabla modificada
- `lib/domain/integrations.ts` — `IntegrationProvider` type, lista paralela que debe coincidir

### Clientes de Supabase
- `createSupabaseServerClient()` → usa `cookies()` → fuerza renderizado dinámico. **Nunca** llamar desde el root layout ni desde páginas con ISR.
- `createSupabaseServiceRoleClient()` → **no** llama a `cookies()`, seguro en layout raíz y en `generateMetadata()`. Omite RLS — solo usar en servidor con datos públicos o en acciones autorizadas.

### Seguridad
- Precio, stock, rol y total siempre se recalculan en servidor antes de crear un pedido.
- RLS activo en todas las tablas de negocio. La clave `anon` solo lee catálogo publicado.
- `SUPABASE_SERVICE_ROLE_KEY` es secreto de servidor — nunca exponer al cliente.
- CSP configurado en `next.config.ts`. Al integrar un nuevo servicio externo, agregar su dominio a `connect-src` e `img-src` según corresponda.

### Server Actions
- Siempre empezar con `await requireAdminUser([...roles])` antes de cualquier mutación.
- Usar `revalidatePath()` al final para invalidar el caché de la página afectada.

### Roles disponibles
`super_admin` · `admin` · `inventory` · `sales`

La tabla `user_roles` tiene clave primaria surrogate `id: string` (agregada en migración 0022) — incluida en `types.ts`.

## Secciones del panel admin (`/admin/*`)

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard con KPIs y resumen |
| `/admin/pedidos` | Listado y detalle de órdenes |
| `/admin/clientes` | Directorio de clientes |
| `/admin/productos` | Catálogo de productos + variantes |
| `/admin/productos/importar` | Importar productos en borrador desde CSV Fina |
| `/admin/categorias` | Árbol de categorías |
| `/admin/marcas` | Gestión de marcas |
| `/admin/inventario` | Stock por variante y sucursal (inline editable) |
| `/admin/finanzas/monedas` | Tasas de cambio |
| `/admin/finanzas/metodos-pago` | Métodos de pago |
| `/admin/entrega/pickup` | Config de retiro/delivery |
| `/admin/entrega/delivery` | Zonas de delivery |
| `/admin/entrega/envios` | Envíos |
| `/admin/entrega/horarios` | Horarios de atención |
| `/admin/marketing/home` | Secciones de la home |
| `/admin/marketing/banners` | Banners |
| `/admin/integraciones/analytics` | GA4 · GTM · Meta Pixel · TikTok · Google Search Console |
| `/admin/integraciones/fina` | Fina Partner: exportar pedidos CSV / importar inventario CSV |
| `/admin/reportes` | Reportes |
| `/admin/apariencia/branding` | Branding / tema |
| `/admin/apariencia/contenido` | Contenido del sitio |
| `/admin/usuarios` | Gestión de roles por usuario (solo super_admin) |
| `/admin/seguridad` | 2FA y seguridad |
| `/admin/salud` | Salud del sistema |

## Convenciones de UI del admin

- Tablas: `rounded-2xl border border-[#EBE0E7] bg-white shadow-[0_1px_3px_rgba(41,37,42,0.06)]`
- Cabeceras de tabla: `text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40`
- Pills de filtro activos: `bg-[#29252A] text-white` (Todos) o `bg-[#7B1847] text-white` (estado específico)
- Empty states: icono centered en `bg-[#F0D8E8]` dentro de `rounded-2xl`, texto `text-sm font-semibold text-[#29252A]`
- Sidebar: `bg-[#29252A]`, nav activo `bg-[#7B1847]/20 text-[#7B1847]`
- `AdminShell` exporta un wrapper con `<Suspense>` para resolver React error #441 (`usePathname` suspendiendo)

## Integraciones externas importantes

- **Cloudinary**: subida de imágenes. Dominios `api.cloudinary.com` (connect-src) y `res.cloudinary.com` (img-src) ya en la CSP de `next.config.ts`.
- **Unsplash**: imágenes de demo. Dominio `images.unsplash.com` ya en `remotePatterns` de `next.config.ts`.
- **Fina Partner**: sin API pública. Integración vía CSV unidireccional (Fina → Zoe) desde `/admin/integraciones/fina`. Ver sección detallada abajo.
- **Google Search Console**: verificación vía meta tag. El código se guarda en `integrations` con provider `google_search_console` y se inyecta en `generateMetadata()` del root layout.

## Integración Fina Partner (detalle)

Página: `app/admin/(protected)/integraciones/fina/page.tsx`. Dos modos (la exportación de pedidos fue eliminada):

### 1 — Importar inventario formato nativo Fina (Fina → Zoe)
Route: `POST /api/admin/import/fina-nativo` → `app/api/admin/import/fina-nativo/route.ts`  
Componente: `components/admin/fina-nativo-import-form.tsx`

**Solo actualiza stock de variantes ya existentes** — no crea productos nuevos. Para crear productos usar la sección de abajo.

Acepta **CSV, XLSX, XLSM, XLS** (usa `xlsx@0.18.5` / SheetJS). Parsea el formato jerárquico de Fina:
- Filas `Tipo=Item` → nombre y SKU del producto padre
- Filas `Tipo=Variacion` → talla/size individual

**Columnas reconocidas:**
| Columna Fina | Uso |
|---|---|
| `Tipo` | `Item` o `Variacion` |
| `Nombre` | nombre del item / talla de la variación |
| `SKU` | SKU del item padre (puede estar vacío) |
| `Categoria` | ignorada en este modo |
| `Costo unitario` | `cost_usd` de la variante |
| `Valor en inventario` | precio de venta = valor / cantidad |
| `Sin ubicación`, `Cualquiera` | siempre ignoradas |
| Columnas de sede | detectadas automáticamente por nombre fuzzy |

**Detección de tiendas:** `storeMatchesColumn(storeName, storeCode, colLabel)` extrae palabras >3 chars del encabezado CSV y verifica si aparecen en el nombre O el `code` de la tienda en DB (normalizado, sin tildes). Si no hay match, la columna aparece en `unknownStoreColumns` con sugerencia de crear la sucursal.

**Fallback store:** Si ninguna columna de tienda es reconocida, se puede seleccionar una tienda destino en el formulario y se usa la columna `Cantidad` total.

**Búsqueda de variantes existentes:** candidatos en orden: `SKU-talla`, `SKU_talla`, `NOMBRE-talla`, `NOMBRE_talla`, `SKU` bare (fallback). Búsqueda con `.ilike()` (case-insensitive). **Importante:** las búsquedas filtran `deleted_at IS NULL` en el producto padre para no matchear contra variantes huérfanas de productos borrados.

**Paso de mapeo de columnas:** después de subir el archivo, se muestra una tabla interactiva donde el usuario confirma/corrige qué columna corresponde a qué tienda o campo antes de importar. El mapping se envía como JSON en `column_mapping`. Helpers compartidos en `lib/domain/fina-nativo-helpers.ts`.

### 3 — Importar productos nuevos desde Fina
Route: `POST /api/admin/import/productos` → `app/api/admin/import/productos/route.ts`  
Componente: `components/admin/import-products-form.tsx`  
Página: `/admin/productos/importar`

Crea productos en borrador a partir del mismo formato CSV de Fina **sin tocar inventario**. Flujo de un solo paso (sin mapping manual):
- Auto-detecta columnas `Tipo`, `Nombre`, `SKU`, `Categoria`, `Costo unitario`
- Por cada grupo Item: verifica si el producto ya existe (por SKU o nombre, filtrando `deleted_at IS NULL`)
- Si no existe: crea árbol completo `products` (status `draft`) → `product_options` (Talla) → `product_option_values` → `product_variants` (price_usd=0, cost_usd del CSV) → `variant_option_values`
- SKU de variante: `{PARENTSKU}-{talla}` o `{NOMBRE_UPPER}-{talla}`
- Retorna `{ total, created, exists, errors, results }` — `FinaNativoImportResponse` **no** incluye `created`; el tipo de esta ruta es `ImportProductsResponse`
- Al terminar enlaza a `/admin/productos?estado=draft`

**Flujo recomendado:** primero importar productos desde `/admin/productos/importar`, luego sincronizar inventario desde `/admin/integraciones/fina`.

### 2 — Importar inventario CSV plano (formato personalizado)
Route: `POST /api/admin/import/inventario`  
Componente: `components/admin/fina-import-form.tsx`  
CSV simple con columnas `sku, cantidad` (acepta aliases). Para ajustes manuales.

---

## Datos de inventario

Tablas: `inventory` (variant_id + store_id → quantity_on_hand) + `inventory_movements` (audit trail). Los tipos de movimiento son: `entrada | salida | ajuste | transferencia | venta | liberacion`. Todo ajuste manual crea un registro en `inventory_movements`.

**Tabla de inventario (`/admin/inventario`):** `components/admin/inventory-table.tsx`
- Vista agrupada por producto: header por cada producto (nombre + stock total + tallas + pill de margen promedio) con sus variantes indentadas debajo.
- Columnas por sucursal dinámicas según tiendas activas en DB.
- `StockCell`: edición inline con guardado al perder foco (onBlur) o al presionar Enter. Muestra botón ✓ cuando el valor es distinto al guardado. Callback `onSaved` actualiza el Total de la fila en tiempo real sin recargar.
- `PriceCell`: edición inline de `price_usd` vía `updateVariantPriceAction`. Guarda en onBlur. Revalida `/admin/inventario` y la página del producto.
- `CostCell`: edición inline de `cost_usd` vía `updateCostAction`. Guarda en onBlur. Revalida `/admin/inventario` y la página del producto.
- `MarginBadge`: muestra `+$X` y `Y%` de margen bruto (`(precio - costo) / precio`). Verde ≥ 30%, amarillo ≥ 15%, rojo < 15%. Aparece en cada variante y el header de producto muestra el promedio.
- Total reactivo: `InventoryTable` mantiene `stockOverrides: Map<variantId:storeId, qty>` y lo suma sobre los valores del servidor al renderizar el total de cada fila y del header de producto.
- **Borrado a dos niveles**: botón 🗑️ en el header del producto (soft-delete: `deleted_at = now()` vía `deleteProductFromInventoryAction`) y botón 🗑️ por variante individual (`status = inactive` vía `deleteVariantAction`). Ambos con confirmación inline de dos pasos. La fila desaparece del cliente inmediatamente sin recargar.
- Actions en `app/admin/(protected)/inventario/actions.ts`: `updateInventoryAction`, `updateCostAction`, `updateVariantPriceAction`, `getMovementsAction`, `deleteVariantAction`, `deleteProductFromInventoryAction`.

**Sincronización precio/costo entre módulos:**
- Editar `price_usd` desde inventario → revalida también `/admin/productos/[id]`
- Editar `cost_usd` desde inventario → revalida también `/admin/productos/[id]`
- Editar `price_usd`, `cost_usd` o `barcode` desde el editor de producto → revalida también `/admin/inventario`

## Sistema de banners y secciones del Home

- **Tabla `banners`**: campos `image_desktop_url`, `image_mobile_url`, `headline`, `copy`, `cta_label`, `cta_url`, `position` (default `'home'`), `priority` (int), `active`, `starts_at`/`ends_at` opcionales para ventanas de tiempo.
- **`getActiveBanners(supabase, position)`** en `lib/domain/home.ts` retorna **todos** los banners activos de la posición ordenados por prioridad, filtrados por ventana de fechas. Es la función principal para el carousel.
- **`getActiveBanner`** (deprecada) retorna solo el primero; se mantiene para uso futuro fuera del Home.
- **`BannerCarousel`** (`components/home/banner-carousel.tsx`): componente Client con autoavance cada 5 s, flechas y puntos. Muestra `image_mobile_url` en móvil (aspect 4:5) e `image_desktop_url` en desktop (aspect 21:9). Si hay un solo banner, se muestra estático sin controles.
- **`HomeSectionView.banners`** es `BannerView[]` (plural). El renderer llama a `<BannerCarousel banners={section.banners} />`.
- Las secciones del Home se administran desde `/admin/marketing/home` (tabla `home_sections`). El bloque tipo `"banner"` toma `config.position` para saber qué pool de banners mostrar.

## Productos — borrado y gestión de imágenes

- **Borrado de productos**: soft-delete — se escribe `deleted_at = now()`. Las queries públicas y del admin filtran `.is("deleted_at", null)`. Acción: `deleteProduct(productId)` en `actions.ts`, componente `DeleteProductButton` (variante `"full"` en detalle, `"icon"` en lista).
- **Borrado de imágenes**: `deleteImageAction(imageId, productId)`. Si era la imagen principal (`is_primary=true`), promueve automáticamente la siguiente por orden. Componente `DeleteImageButton` (X absoluto sobre el thumbnail, visible en hover).
- `listPublishedProducts` filtra `status='published'` + `deleted_at IS NULL` + al menos una variante activa.

## Editor de producto — página `/admin/productos/[id]`

### Panel de información general
Componente: `components/admin/edit-product-info-form.tsx` — formulario con todos los campos del producto, editable en cualquier momento.

Campos editables: nombre, SKU del producto, marca, categoría, género, descripción corta, descripción completa, material, checkbox "Nuevo", título SEO y meta descripción.

Action: `updateProductInfoAction(productId, _prev, formData)` en `productos/actions.ts`. Si el nombre cambia, regenera el slug con `generateUniqueSlug` y registra el redirect con `recordSlugChangeIfNeeded`. Usa `useActionState` + `useRef` para mostrar "Guardado" solo tras la primera submisión (no en el render inicial).

### Variantes inline
Componente: `components/admin/edit-variant-row.tsx` — cada fila de la tabla de variantes es editable directamente sin modal.

**Edición inline (`EditCell`):** clic sobre el valor → input; blur o Enter guarda; Escape revierte. Las celdas editables son:
- **Talla** — llama a `updateOptionValueAction(optionValueId, productId, value)`
- **SKU** — llama a `updateVariantFieldsAction(variantId, productId, { sku })`
- **Precio** — llama a `updateVariantFieldsAction(variantId, productId, { priceUsd })`
- **Costo** — llama a `updateVariantFieldsAction(variantId, productId, { costUsd })`
- **Código** (`barcode`) — llama a `updateVariantFieldsAction(variantId, productId, { barcode })`
- **Estado** — toggle pill Activo/Inactivo con optimistic update vía `useTransition`

`updateVariantFieldsAction` acepta `{ sku, priceUsd, compareAtPriceUsd, costUsd, barcode, status }` y revalida tanto `/admin/productos/[id]` como `/admin/inventario`.

**`InventoryCell`** (`components/admin/inventory-cell.tsx`): celda de cantidad por tienda dentro del editor de producto. Usa `savedQty` ref (no la prop `initialQuantity`) para detectar cambios reales. Guarda en blur o Enter, muestra borde amarillo + botón ✓ cuando hay valor pendiente, revierte y muestra borde rojo si el save falla.

**Fotos por variante:** hasta 3 imágenes por variante. Se suben con `uploadImage` (Cloudinary) y se enlazan vía `addVariantImageAction` → inserta en `product_images` (con `product_id`) y luego en `variant_images` (junction). Para quitar: `removeVariantImageAction` desvincula y elimina la imagen si quedó huérfana.

**Eliminar variante:** `deleteVariantAction(variantId, productId)` en `app/admin/(protected)/productos/actions.ts`:
1. Desvincula y elimina imágenes huérfanas (`variant_images` → `product_images`)
2. Elimina `variant_option_values`
3. Elimina filas de `inventory`
4. Elimina la variante (`product_variants`)
- UI: icono basura → confirmación inline "¿Eliminar? Sí / No" → la fila desaparece optimistamente (`isDeleted → return null`)
- **Diferencia importante:** este `deleteVariantAction` (en `productos/actions.ts`) hace hard-delete real. El homónimo en `inventario/actions.ts` solo pone `status = inactive`.

**Galería pública por variante:** `components/product/product-page-client.tsx` es un Client Island que posee el estado `displayImages`. Cuando el usuario selecciona una talla, `ProductVariantPicker` llama `onVariantMatch(variantId)` → el island intercambia las fotos de la galería por las de esa variante (fallback a imágenes del producto si la variante no tiene fotos). Los datos de imágenes de variante llegan en la query SSR de `getPublishedProductBySlug` vía `variant_images(product_images(url, alt_text))`.

## Creación de producto — formulario dos fases

`components/admin/new-product-form.tsx` usa un flujo de dos fases sin redirección:

1. **Fase 1 — datos**: formulario con nombre, SKU, marca, categoría, género, descripciones, material. La Server Action `createProduct` retorna `{ productId, productName }` en el `FormState` en lugar de llamar a `redirect()`.
2. **Fase 2 — fotos** (`ImagePhase`): se renderiza en el mismo componente cuando `state.productId` está definido. Llama a `addImageAction` directamente, muestra thumbnails de las fotos guardadas, y ofrece "Ir al producto" + "Crear otro producto".

## Componentes de admin reutilizables

- **`DeleteItemButton`** (`components/admin/delete-item-button.tsx`): botón de borrado con confirmación inline de dos pasos. Primer clic muestra "¿Eliminar? Sí / No"; Sí llama `action(id)` via `useTransition`. Props: `{ id: string; action: (id: string) => Promise<void> }`. Usado en categorías, marcas, zonas de delivery y empresas de envío.
- **`ToggleActive`**: toggle de activar/desactivar con optimistic update local — siempre actualizar `localActive` con `useState` y sincronizar después con la Server Action, para evitar que el toggle "salte" de vuelta mientras espera la respuesta.

## Notas sobre la DB de demo

- Script en `supabase/seed/demo_data.sql` — idempotente: si ya existe `slug='tenis-clasico-blanco'`, no corre.
- Columna `is_new` en `products` se debe citar siempre como `"is_new"` en SQL (es keyword reservada en PostgreSQL dentro de triggers).
- La tabla `stores` tiene columna `code` NOT NULL — incluirla en cualquier INSERT manual.
- Si el script ya corrió y se necesita agregar nuevos registros (ej. banners), hacerlo con SQL directo usando `INSERT ... WHERE NOT EXISTS` o `UPDATE ... WHERE name = '...'`.

## Identidad de marca

**Nombre oficial:** Zoe Shop (RIF: UNIVERSO ZOE SHOP, C.A — J507908810)  
**Rubro:** Calzado al mayor y al detal — 20 años de trayectoria  
**Logo:** `public/logo.jpeg` — "ZOE" bold en caja blanca + "shop" en cursiva, fondo negro  
**WhatsApp:** `584244738930` (0424-4738930)  
**Instagram:** `@Zoe_dist`

**Sedes:**
- **Centro:** Calle Independencia esq. Díaz Moreno, C.C. ilduomo Local LB01, Valencia 2001, Carabobo
- **Av. Bolívar:** Av. Bolívar Norte, al lado del C.C. Villa Alegre, Valencia 2001, Carabobo

**Categorías:** Damas · Caballeros · Adulto mayor · Tallas plus · Escolares · Deportivos  
**Especialidad:** Tacones y stilettos importados, quinceañeras, deportivo, sandalias ortopédicas y confort

Los textos y datos de contacto por defecto viven en `lib/domain/site-content-types.ts` (`DEFAULT_SITE_CONTENT`). El admin puede sobreescribirlos desde `/admin/apariencia/contenido`.

## CRM de clientes (Fase 13 — migración 0024)

**Tablas:** `customer_tags`, `customer_tag_assignments`, `customer_notes`

**Segmentación RFM automática** (`lib/domain/customers.ts`):
- `VIP` · `Frecuente` · `Regular` · `Nuevo` · `En riesgo` · `Inactivo`

**Rutas admin:**
- `/admin/clientes` — lista con búsqueda, filtros por segmento y ordenamiento
- `/admin/clientes/[id]` — perfil completo: KPIs, historial pedidos, notas, etiquetas, direcciones, UTMs

**Componentes clave:**
- `customer-segment-badge` — pill de color por segmento
- `add-customer-note-form` — formulario de nota inline
- `customer-tags-editor` — editor de etiquetas con autocompletado

El detalle de pedido (`/admin/pedidos/[id]`) incluye enlace "Ver perfil de cliente →" al perfil del CRM.
