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
- `createSupabaseServerClient()` → usa `cookies()` → fuerza renderizado dinámico. **Nunca** llamar desde el root layout ni desde páginas con ISR. En el admin, solo se usa en los archivos de MFA (`mfa/*`), seguridad (`seguridad/page.tsx`, `seguridad/actions.ts`) y el layout protegido — todos necesitan `supabase.auth.*` con la sesión real del usuario.
- `createSupabaseServiceRoleClient()` → **no** llama a `cookies()`, omite RLS por completo. Es la opción correcta para **todas** las pages y actions del admin `(protected)/**` (la autorización ya la hace `requireAdminUser()` en código).

**Patrón del admin (desde migración de perf 2026-08-22):**
- Todas las `page.tsx` y `actions.ts` bajo `(protected)/` usan `createSupabaseServiceRoleClient()`.
- `getAdminSessionUser()` (`lib/auth/session.ts`) usa `createSupabaseServerClient()` solo para `auth.getUser()` (verificar JWT via cookies) y luego `createSupabaseServiceRoleClient()` para leer `user_roles` — esto evita el bloqueo de RLS sobre `user_roles` que impedía a usuarios no-super_admin cargar sus roles.
- Excepciones que conservan `createSupabaseServerClient()`: `layout.tsx`, `seguridad/page.tsx`, `seguridad/actions.ts`, `mfa/enroll/*`, `mfa/challenge/*`.

### Seguridad
- Precio, stock, rol y total siempre se recalculan en servidor antes de crear un pedido.
- RLS activo en todas las tablas de negocio. La clave `anon` solo lee catálogo publicado.
- `SUPABASE_SERVICE_ROLE_KEY` es secreto de servidor — nunca exponer al cliente.
- CSP configurado en `next.config.ts`. Al integrar un nuevo servicio externo, agregar su dominio a `connect-src` e `img-src` según corresponda.
- Migración `0025_fix_user_roles_read_own.sql`: agrega policy `user_read_own_roles` en `user_roles` — defensa en profundidad para que usuarios autenticados lean sus propias filas vía RLS.
- Migración `0026_allow_duplicate_sku.sql`: elimina el constraint `UNIQUE` de `products.sku` y `product_variants.sku`. El SKU identifica un modelo/estilo, no un registro único — el mismo SKU puede repetirse en distintos colores o tallas.

### Server Actions
- Siempre empezar con `await requireAdminUser([...roles])` antes de cualquier mutación.
- Después del check, usar `createSupabaseServiceRoleClient()` para todas las operaciones de DB.
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
| `/admin/entrega/sucursales` | Crear, editar, activar y eliminar sucursales |
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

## Menú hamburguesa móvil

`components/layout/mobile-menu.tsx` — drawer deslizable desde la izquierda.

**Regla importante:** el panel del drawer usa **únicamente estilos inline** (no clases Tailwind) para evitar inconsistencias entre navegadores con `flex-1` y `height`. El panel padre necesita `height: "100vh"` explícito; de lo contrario `flex: 1` en el nav no tiene altura de referencia y los links no aparecen.

```tsx
// Estructura del panel:
<div style={{ position:"absolute", top:0, left:0, width:"290px", height:"100vh",
              zIndex:10, display:"flex", flexDirection:"column",
              backgroundColor:"#ffffff", transform: open ? "translateX(0)" : "translateX(-100%)",
              transition:"transform 280ms ease-out" }}>
  {/* Cabecera: logo + X */}
  {/* Nav: style={{ flex:1, overflowY:"auto", padding:"12px" }} */}
  {/* Pie: dirección + Instagram */}
</div>
```

El backdrop también usa `transition` como estilo inline (`opacity 280ms ease`). La apertura usa doble `requestAnimationFrame` para que el estado `open=true` dispare la transición CSS después del primer render visible.

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
Página: `/admin/productos/importar` (tab "Formato nativo Fina")

Crea productos en borrador a partir del mismo formato CSV de Fina **sin tocar inventario**. Flujo de un solo paso (sin mapping manual):
- Auto-detecta columnas `Tipo`, `Nombre`, `SKU`, `Categoria`, `Costo unitario`
- Por cada grupo Item: verifica si el producto ya existe (por SKU o nombre, filtrando `deleted_at IS NULL`)
- Si no existe: crea árbol completo `products` (status `draft`) → `product_options` (Talla) → `product_option_values` → `product_variants` (price_usd=0, cost_usd del CSV) → `variant_option_values`
- SKU de variante: `{PARENTSKU}-{talla}` o `{NOMBRE_UPPER}-{talla}`
- Retorna `{ total, created, exists, errors, results }` — tipo `ImportProductsResponse`
- Al terminar enlaza a `/admin/productos?estado=draft`

### 4 — Importar productos nuevos en formato personalizado (CSV plano completo)
Route: `POST /api/admin/import/productos-custom` → `app/api/admin/import/productos-custom/route.ts`  
Componente: `components/admin/import-products-custom-form.tsx`  
Página: `/admin/productos/importar` (tab "Formato personalizado")

**Todo en un solo CSV:** crea productos + variantes + fija inventario por tienda en un solo paso.

**Formato:** una fila por combinación variante+talla. Filas con mismo `nombre+sku` se agrupan en un producto.

| Columna | Obligatoria | Descripción |
|---|---|---|
| `nombre` | sí | Nombre del producto (alias: `name`, `producto`) |
| `sku` | no | SKU padre del modelo (alias: `codigo`) |
| `categoria` | no | Nombre de categoría existente en DB |
| `variante` | no | Color/estilo del modelo (alias: `color`, `variant`, `modelo`) |
| `talla` | sí | Talla de la combinación (alias: `size`, `talle`) |
| `precio_venta` | no | Precio USD (alias: `precio`, `price`) |
| `precio_costo` | no | Costo USD (alias: `costo`, `cost`, `costounitario`) |
| `{CODIGO_TIENDA}` | no | Stock para esa tienda — detectado por `store.code` exacto |

**Lógica de dimensiones:**
- Sin `variante`: crea 1 `product_option` llamada `Talla` (comportamiento original)
- Con `variante`: crea 2 `product_options`: `Variante` (order 1) + `Talla` (order 2). Los valores de cada opción se deduplicán por orden de aparición en el CSV — "Negro" no se inserta dos veces aunque aparezca en varias filas.
- SKU de variante: `{SKU}-{VARIANTE}-{TALLA}` cuando hay variante, `{SKU}-{TALLA}` cuando no
- La agrupación en producto siempre es por `nombre+sku` — no por variante

- Detección de columnas de tienda: header normalizado debe coincidir exactamente con `store.code` (case-insensitive)
- Inventario: INSERT en `inventory` + movimiento `entrada` en `inventory_movements`
- Retorna `{ total, created, exists, errors, variantsCreated, inventorySet, results }` — tipo `ImportCustomResponse`
- Al terminar enlaza a `/admin/productos?estado=draft` y `/admin/inventario`
- CSV de ejemplo: `public/samples/ejemplo-productos-personalizado.csv`

**Selector de formato:** `components/admin/import-products-tabs.tsx` — client component con dos tabs que alterna entre `ImportProductsForm` y `ImportProductsCustomForm`. La página `importar/page.tsx` es server component que fetcha stores y los pasa al tabs component.

**Flujo recomendado para carga desde cero:** usar el tab "Formato personalizado" — crea productos e inventario en un solo paso sin necesidad de importar desde Fina.

### 2 — Importar inventario CSV plano (formato personalizado — solo stock)
Route: `POST /api/admin/import/inventario`  
Componente: `components/admin/fina-import-form.tsx`  
CSV simple con columnas `sku, cantidad` (acepta aliases). Para ajustes manuales de stock de variantes ya existentes.

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
- **`BannerCarousel`** (`components/home/banner-carousel.tsx`): componente Client con autoavance cada 5 s, flechas y puntos. Layout en dos paneles: panel izquierdo (42% ancho) con gradiente vino `#7B1847 → #A0325E` contiene headline + copy + CTA; panel derecho (`flex-1`) contiene la imagen con `object-cover`. Este layout evita texto sobre la imagen (enfoque anterior fallaba cuando el sujeto quedaba centrado). En móvil los paneles se apilan (texto arriba, imagen abajo). Si hay un solo banner, se muestra estático sin controles. Fallback image: `images.unsplash.com/photo-1543163521-1bf539c55dd2`.
- **`HomeSectionView.banners`** es `BannerView[]` (plural). El renderer llama a `<BannerCarousel banners={section.banners} />`.
- Las secciones del Home se administran desde `/admin/marketing/home` (tabla `home_sections`). El bloque tipo `"banner"` toma `config.position` para saber qué pool de banners mostrar.

### Admin de secciones del Home — edición inline de config

`HomeSectionRow` (`components/admin/home-section-row.tsx`) incluye botón "Config" que expande un `<textarea>` con el JSON actual del campo `config`. Permite editar y guardar sin salir de la página. Action: `updateHomeSectionConfig(id, rawConfig)` en `marketing/home/actions.ts` — valida que sea objeto JSON válido antes de persistir. La página `marketing/home/page.tsx` incluye `config` en el `select()` y lo pasa a cada `HomeSectionRow`.

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

**Galería pública por variante:** `components/product/product-page-client.tsx` es un Client Island con dos estados: `displayImages` (qué set de imágenes mostrar) y `selectedIndex` (cuál imagen está activa). Cuando el usuario selecciona una talla, `ProductVariantPicker` llama `onVariantMatch(variantId)` → el island intercambia las fotos y resetea `selectedIndex` a 0 (fallback a imágenes del producto si la variante no tiene fotos). El strip de miniaturas muestra **todas** las imágenes del set actual; cada miniatura es un `<button>` con `onClick={() => setSelectedIndex(i)}` y la activa recibe `ring-2 ring-[var(--color-primary)]`. El strip solo se renderiza si hay más de 1 imagen. Los datos de imágenes de variante llegan en la query SSR de `getPublishedProductBySlug` vía `variant_images(product_images(url, alt_text))`.

## Creación de producto — formulario dos fases

`components/admin/new-product-form.tsx` usa un flujo de dos fases sin redirección:

1. **Fase 1 — datos**: formulario con nombre, SKU, marca, categoría, género, descripciones, material. La Server Action `createProduct` retorna `{ productId, productName }` en el `FormState` en lugar de llamar a `redirect()`.
2. **Fase 2 — fotos** (`ImagePhase`): se renderiza en el mismo componente cuando `state.productId` está definido. Llama a `addImageAction` directamente, muestra thumbnails de las fotos guardadas, y ofrece "Ir al producto" + "Crear otro producto".

## Sucursales (`/admin/entrega/sucursales`)

Gestión completa de tiendas físicas. La tabla `stores` es la fuente de verdad para el inventario por tienda, el checkout (retiro/delivery) y los horarios de atención.

**Archivos clave:**
- `app/admin/(protected)/entrega/sucursales/page.tsx` — lista activas/inactivas
- `app/admin/(protected)/entrega/sucursales/actions.ts` — Server Actions
- `components/admin/create-store-form.tsx` — formulario inline de creación
- `components/admin/store-card.tsx` — card con edición inline, toggles y borrado
- `components/admin/store-fields.tsx` — campos compartidos entre create y edit

**Campos de la tabla `stores`:** `name`, `code` (texto corto único, e.g. "CTR"), `slug` (auto desde name), `address`, `city`, `state`, `phone`, `whatsapp`, `google_maps_url`, `lat`, `lng`, `pickup_enabled`, `delivery_enabled`, `active`.

**Actions disponibles:**
- `createStore` — requiere `super_admin` o `admin`; genera `slug` automáticamente desde el nombre
- `updateStore(id, ...)` — edita todos los campos; regenera `slug` si cambia el nombre
- `toggleStoreActive(id, active)` — activa/desactiva la sucursal
- `toggleStorePickup(id, pickup_enabled)` — habilita/deshabilita retiro en tienda
- `toggleStoreDelivery(id, delivery_enabled)` — habilita/deshabilita delivery
- `deleteStore(id)` — hard-delete, requiere `super_admin`; el borrado falla si hay pedidos u horarios referenciando la tienda (FK constraint)

Todas las actions revalidan `/admin/entrega/sucursales`, `/admin/entrega/pickup` y `/admin/entrega/horarios`.

**Nota:** el `code` de la tienda es el campo que usa la importación Fina para detectar columnas de inventario (`storeMatchesColumn`). Si se crea una sucursal nueva, el `code` debe coincidir con la columna del CSV de Fina.

## Componentes de admin reutilizables

- **`DeleteItemButton`** (`components/admin/delete-item-button.tsx`): botón de borrado con confirmación inline de dos pasos. Primer clic muestra "¿Eliminar? Sí / No"; Sí llama `action(id)` via `useTransition`. Props: `{ id: string; action: (id: string) => Promise<void> }`. Usado en categorías, marcas, zonas de delivery y empresas de envío.
- **`ToggleActive`**: toggle de activar/desactivar con optimistic update local — siempre actualizar `localActive` con `useState` y sincronizar después con la Server Action, para evitar que el toggle "salte" de vuelta mientras espera la respuesta.
- **`CategoryImageButton`** (`components/admin/category-image-button.tsx`): thumbnail 40×40 por fila de categoría. Clic → abre file input → sube con `uploadImage()` (Cloudinary) → llama `updateCategoryImage(id, url)`. Botón X para quitar la imagen. La action `updateCategoryImage` está en `categorias/actions.ts` y revalida `/` y `/admin/categorias`.
- **`PublishAllDraftsButton`** (`components/admin/publish-all-drafts-button.tsx`): flujo dos pasos — idle → confirmar (Sí/Cancelar) → toast con cantidad publicada y reset a 3 s. Solo se renderiza cuando `draftCount > 0`. Action: `publishAllDraftProductsAction()` en `productos/actions.ts` — actualiza `status='published'` en todos los drafts no borrados y revalida `/admin/productos`, `/catalogo`, `/`.

## Home pública — reglas ISR y categorías

### ISR + cookies() — antipatrón crítico
`app/(public)/page.tsx` usa `export const revalidate = 60`. En ese contexto **nunca** llamar a `createSupabaseServerClient()` porque internamente llama a `cookies()`, que lanza excepción en el rebuild de fondo de ISR. La excepción queda silenciada en el try/catch de Next.js y la página renderiza vacía. Solución: usar siempre `createSupabaseServiceRoleClient()` en todas las pages públicas con ISR.

### Categorías en el Home
- Grid 2×5 (`grid-cols-2 sm:grid-cols-5`) en `components/home/home-section-renderer.tsx`.
- Imágenes por categoría: columna `image_url` en la tabla `categories`. Si está vacía, el renderer usa `CATEGORY_FALLBACK_IMAGES[slug]` (mapa hardcodeado de Unsplash por slug: `damas`, `caballeros`, `deportivos`, `escolares`, `adulto-mayor`, `tallas-plus`).
- **Límite de categorías**: en `lib/domain/home.ts`, cuando el bloque `categories` no tiene `categoryIds` específicos en su config, siempre se fetchan hasta 20 categorías activas, ignorando `config.limit`. Esto evita que categorías queden ocultas por un límite viejo guardado en DB.

### Hero section
`app/(public)/page.tsx` renderiza una sección Hero con imagen de fondo (Unsplash `photo-1483985988355-763728e1935b`) + dos gradientes superpuestos (lateral + vertical) para legibilidad del texto. No usar el bloque `"hero"` de `home_sections` para este header — es un componente fijo en la página.

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

## Cuentas de infraestructura

| Servicio | Cuenta |
|---|---|
| **Vercel** | `andresksz66` |
| **Supabase** | `andresksz66@gmail.com` |
| **GitHub** | `aandreskss` (repo `zoewhatsappcatalogo`) |

URL del sitio: `https://zoecatalogo.vercel.app`
