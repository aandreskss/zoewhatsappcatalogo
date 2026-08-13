# Zoe Catalog — Documento Maestro de Planificación

**Proyecto:** Catálogo WhatsApp Zoe Shoes
**Fase:** Planificación funcional, técnica y de producto (sin código)
**Fecha:** 13 de agosto de 2026 (actualizado el mismo día con decisiones confirmadas)

**Registro de cambios de esta actualización:**

1. WhatsApp: decidido — el mensaje siempre llega al número configurado de la **sucursal elegida** por el cliente (estrategia `by_store` confirmada como la única del MVP).
2. Precios: decidido — se muestran **siempre en USD y en Bs simultáneamente** (no como alternancia opcional).
3. Nueva funcionalidad de negocio incorporada: **conexión automática con la tasa oficial BCV** (dólar y euro), configurable desde el dashboard, con snapshot por pedido y fallback manual.
4. Se revisaron las instrucciones permanentes completas del proyecto (versión extendida de 145 reglas) y se incorporan aquí los puntos que no estaban cubiertos en la primera versión de este documento: motor de importación genérico con perfiles (Fina como un adaptador, no como dependencia), separación total de la futura versión genérica "Blank Catalog", IDs de pedido no usados como autorización, y la regla de prioridad de decisión técnica (sección 1).

---

## 1. Resumen ejecutivo

Zoe Catalog es una plataforma de **comercio conversacional**: un catálogo digital rápido, visual y mobile-first que captura intención de compra (producto, variante, talla, datos del cliente, forma de entrega, preferencia de pago), **registra un pedido verificado en servidor** y luego entrega ese pedido a un vendedor humano a través de WhatsApp para que cierre la venta. No es un ecommerce de pago en línea; es un generador de leads de altísima calidad con trazabilidad completa desde el clic en un anuncio hasta la venta confirmada en tienda.

El sistema tiene tres caras que deben construirse con el mismo nivel de cuidado:

1. **Cara pública** — catálogo, producto, carrito, checkout — optimizada para conversión, velocidad y uso desde el teléfono, porque la inmensa mayoría del tráfico llegará desde redes sociales.
2. **Cara operativa (WhatsApp)** — el pedido debe llegar al vendedor como un mensaje limpio, completo y accionable, y el sistema debe saber diferenciar entre "el cliente mandó el pedido" y "la venta se concretó".
3. **Cara administrativa** — un dashboard que le permita a personal no técnico (dueño, vendedoras, encargado de inventario) operar el negocio completo — productos, precios, stock por sucursal, tasa de cambio, banners, pedidos — sin tocar código.

La arquitectura se diseña para una sola marca (Zoe) con dos sucursales hoy, pero ningún dato de negocio (tiendas, WhatsApp, monedas, categorías, métodos de pago) queda hardcodeado: todo vive en base de datos y es editable desde el panel. Esto da flexibilidad para crecer (más sucursales, más categorías de producto) sin construir de más (no se implementa multi-tenant/SaaS, billing ni aislamiento de tenants, porque hoy no hay ese problema).

El criterio rector de todo el documento a nivel de **producto** es: **conversión + facilidad de uso + velocidad + administración + WhatsApp + inventario + analítica + escalabilidad razonable**, en ese orden de prioridad cuando hay conflicto sobre _qué construir primero_.

A nivel de **decisión técnica** (cuando hay dos formas válidas de resolver algo), el orden de prioridad es distinto y se toma de las instrucciones permanentes del proyecto: **seguridad → integridad de datos → experiencia de usuario → correctitud → mantenibilidad → performance → simplicidad → escalabilidad razonable → velocidad de desarrollo**. Ningún atajo de velocidad de desarrollo debe sacrificar los primeros puntos de esta lista. Ambos criterios se usan juntos a lo largo de este documento: el primero ordena el roadmap, el segundo resuelve trade-offs de arquitectura.

---

## 2. Objetivos comerciales

- Convertir el tráfico de Instagram/TikTok/Facebook/Google/WhatsApp en pedidos calificados, con la menor fricción posible entre "vio el zapato" y "el pedido está en manos de una vendedora".
- Eliminar la dependencia actual (típica de zapaterías venezolanas) de "escríbeme por WhatsApp para saber si hay talla": el cliente debe poder autoservirse el 90% del proceso y llegar a WhatsApp solo para confirmar y pagar.
- Dar visibilidad real del negocio al dueño: qué se vende, qué talla, qué sucursal, qué campaña funciona, qué se busca y no se encuentra — información que hoy probablemente vive solo en la cabeza de las vendedoras.
- Controlar inventario por sucursal para evitar prometer stock que no existe (pérdida de confianza) y evitar "vender dos veces la última talla 38".
- Sentar una base técnica que permita agregar categorías (carteras, accesorios) y sucursales sin reescribir el sistema.
- Preparar (sin construirla aún) la extensibilidad hacia venta en línea con pago, cupones, reseñas y feeds de catálogo para Meta/Google/TikTok.

---

## 3. Usuarios (personas)

**Cliente — María, 27 años, Valencia.** Llega desde una story de Instagram. Usa Android gama media, datos móviles no siempre estables. Quiere ver fotos claras, saber si hay su talla, y no perder tiempo llenando formularios. No tiene ni quiere crear una cuenta. Termina en WhatsApp porque así compra todo en Venezuela: es lo que le da confianza (hablar con una persona antes de pagar).

**Vendedora — Carla, atiende el WhatsApp de la sucursal Centro.** No es técnica. Recibe el mensaje de pedido, necesita que tenga todo: qué producto, talla, color, cuánto, cómo va a pagar, si retira o le envían. Su trabajo es confirmar disponibilidad y cerrar el pago. Necesita poder marcar el pedido como "confirmado" o "cancelado" fácilmente, incluso desde su teléfono.

**Encargado de inventario — Luis.** Cuenta y ajusta el stock físico en cada tienda. Necesita un módulo simple para hacer entradas, salidas, ajustes y transferencias entre Centro y Av. Bolívar, con historial de quién movió qué y por qué.

**Administrador de catálogo — Andrea.** Sube productos, fotos, precios, categorías, colecciones y banners. No programa. Necesita un formulario de producto claro por secciones, con vista previa, y la posibilidad de guardar como borrador.

**Propietario — el dueño de Zoe.** Quiere un resumen ejecutivo simple: cuánto se vendió hoy/semana/mes, qué producto es el más pedido, qué sucursal rinde más, qué campaña de publicidad realmente trae ventas. No quiere entrar a analizar tablas — quiere números claros y comparaciones contra el período anterior.

---

## 4. Customer Journey

1. **Descubrimiento.** El cliente ve un producto en un story/reel/anuncio de Instagram o Facebook, o busca en Google, o recibe un link por WhatsApp de una amiga.
2. **Aterrizaje.** Cae en la página de producto o en el Home. La página debe cargar rápido (idealmente <2s en 4G) y comunicar de inmediato: foto, precio, si hay talla.
3. **Exploración.** Ve la galería, revisa tallas y colores disponibles, quizás usa Vista Rápida desde el listado para no perder el hilo de navegación, o entra a la ficha completa.
4. **Decisión de variante.** Selecciona talla y color. Si no hay stock de su talla, el sistema debe ofrecerle alternativas (otra sucursal, "avísame cuando esté disponible", productos similares) en vez de un callejón sin salida.
5. **Carrito.** Agrega, sigue navegando, quizás agrega un segundo producto. El carrito debe sobrevivir si cierra la pestaña.
6. **Checkout.** Introduce nombre y teléfono (mínimo indispensable), elige retiro o envío, sucursal o dirección, y preferencia de pago. Todo en el menor número de pantallas/pasos posible.
7. **Confirmación de intención.** Ve un resumen claro de lo que va a pedir y pulsa "Enviar pedido por WhatsApp".
8. **Registro server-side.** El sistema valida stock y precios en servidor, crea el pedido con un ID único, guarda la fuente de tráfico (UTM/fbclid/etc.) y registra el evento de conversión (Lead, no Purchase todavía).
9. **WhatsApp.** Se abre WhatsApp (app o web) con un mensaje ya redactado y completo. El cliente solo pulsa "Enviar".
10. **Cierre humano.** La vendedora confirma disponibilidad, coordina el pago, actualiza el estado del pedido. Cuando el pago se confirma, el pedido pasa a "Pagado"/"Confirmado" y **ahí** se dispara el evento de compra hacia Meta/Google.
11. **Postventa.** Preparación, entrega/envío, entrega, y el cliente queda registrado para futuras campañas o remarketing (con su consentimiento).

Este journey deja claro un punto importante que se retoma en la sección 17 y 61: **"pedido enviado" no es lo mismo que "venta"**. El sistema debe medir ambos por separado.

---

## 5. Sitemap completo

### Área pública

```
/                                  Home
/catalogo                         Catálogo general (búsqueda, filtros, orden)
/categoria/[slug]                 Categoría (ej. /categoria/mujer)
/categoria/[slug]/[subslug]       Subcategoría
/coleccion/[slug]                 Colección (manual o por reglas)
/marca/[slug]                     Marca
/ofertas                          Productos en oferta
/novedades                        Productos nuevos
/producto/[slug]                  Ficha de producto
/buscar?q=                        Resultados de búsqueda
/carrito                          Carrito
/checkout                         Checkout / finalizar pedido
/checkout/confirmacion             Confirmación post-registro de pedido
/favoritos                        Favoritos
/tiendas                          Listado de sucursales
/tiendas/[slug]                   Landing SEO local por sucursal
/faq                               Preguntas frecuentes
/politicas/privacidad              Política de privacidad
/politicas/terminos                Términos y condiciones
/politicas/envios                  Política de envíos/devoluciones
/contacto                         Contacto
/sitemap.xml, /robots.txt          SEO técnico
```

### Área administrativa (`/admin`, no indexable, autenticada)

```
/admin                                  Dashboard principal (KPIs)
/admin/pedidos                          Lista de pedidos
/admin/pedidos/[id]                     Detalle de pedido
/admin/clientes                         Clientes
/admin/clientes/[id]                    Detalle de cliente
/admin/productos                        Lista de productos
/admin/productos/nuevo                  Crear producto
/admin/productos/[id]                   Editar producto
/admin/categorias                       Categorías
/admin/colecciones                      Colecciones
/admin/marcas                           Marcas
/admin/colores                          Colores
/admin/tallas                           Sistemas de tallas
/admin/inventario                       Inventario (vista producto→variante→tienda)
/admin/inventario/movimientos           Historial de movimientos
/admin/inventario/transferencias        Transferencias entre tiendas
/admin/importar                         Importación masiva (CSV/XLSX)
/admin/marketing/home                   Constructor de bloques del Home
/admin/marketing/banners                Banners
/admin/marketing/promociones            Promociones/reglas de precio
/admin/finanzas/monedas                 Monedas y tasa de cambio
/admin/finanzas/metodos-pago            Métodos de pago
/admin/entrega/pickup                   Configuración retiro en tienda
/admin/entrega/delivery                 Zonas y costos de delivery
/admin/entrega/envios                   Empresas de envío nacional
/admin/canales/whatsapp                 Configuración de WhatsApp
/admin/canales/redes-sociales           Redes sociales / integraciones sociales
/admin/integraciones/analytics          GA4, GTM, Meta Pixel/CAPI, TikTok, Google Ads
/admin/apariencia/branding               Logo, colores, tipografía
/admin/apariencia/plantilla               Selección de tema/plantilla
/admin/empresa                          Datos de la empresa
/admin/sucursales                       CRUD de sucursales
/admin/sistema/usuarios                 Usuarios y roles
/admin/sistema/logs                     Audit log
/admin/sistema/backups                  Backups
/admin/reportes                         Reportes/analítica avanzada
/admin/login                            Login (fuera del layout admin)
```

---

## 6. Flujos (diagramas textuales)

**Flujo de compra:**
`Home/Categoría/Búsqueda → Producto (o Vista Rápida) → Selección talla/color → Agregar al carrito → Carrito → Checkout (datos + entrega + pago) → Resumen → [Servidor: validar, recalcular, reservar stock, crear pedido] → Redirección a WhatsApp con mensaje prellenado → Confirmación en pantalla ("tu pedido #ZOE-2026-000154 fue enviado")`

**Flujo de WhatsApp → venta:**
`Pedido creado (estado: Nuevo) → Enviado a WhatsApp (estado: Enviado a WhatsApp) → Vendedora responde → Contactado → Confirmado → Esperando pago / Pagado → Preparando → Listo para entregar → Enviado/Entregado. Alternativamente: Cancelado en cualquier punto antes de Entregado.`

**Flujo de inventario en el checkout (crítico para concurrencia):**
`Cliente confirma pedido → Servidor abre transacción → Bloquea fila de inventario (variante×tienda) → Verifica stock disponible = on_hand - reservas_activas → Si alcanza: crea reserva temporal con expiración → Crea pedido → Commit → Libera bloqueo. Si no alcanza: responde error "talla agotada" antes de tocar WhatsApp.`

**Flujo de reserva temporal:**
`Reserva creada al registrar pedido → Job programado revisa reservas vencidas cada N minutos → Si el pedido sigue en "Nuevo"/"Enviado a WhatsApp" y la reserva venció: libera stock automáticamente → Si la vendedora marca "Confirmado"/"Pagado" antes de vencer: la reserva se convierte en movimiento de salida definitivo.`

**Flujo administrativo de producto nuevo:**
`Admin crea producto (borrador) → Completa información básica, precio, multimedia → Define variantes (color×talla) → Asigna stock inicial por sucursal → Completa SEO → Vista previa → Publica.`

**Flujo de importación masiva:**
`Admin descarga plantilla → Llena CSV/XLSX → Sube archivo → Sistema valida fila por fila (errores se listan sin bloquear todo el archivo) → Admin revisa reporte de errores → Confirma importación de filas válidas → Sistema crea/actualiza productos y variantes.`

---

## 7. Requisitos funcionales por página

**Home.** Header sticky compacto en mobile, hero administrable (con fechas de vigencia), categorías visuales, secciones dinámicas reordenables (nuevos, más vendidos, ofertas, recomendados), banners secundarios, franja de sucursales/WhatsApp, footer con políticas y redes. Todo alimentado por bloques configurables (ver sección 39/109 del brief original → sección "Home administrable" más abajo).

**Catálogo.** Grid de product cards con slider de imágenes, filtros persistentes (categoría, género, marca, precio, talla, color, disponibilidad, sucursal, nuevo, oferta, colección), ordenamiento, paginación o infinite scroll con soporte real de SEO (ver sección 22), buscador integrado, contador de resultados, estado vacío con sugerencias.

**Producto.** Galería con zoom y swipe, selector de color que cambia imágenes, selector de talla con estados (disponible/agotado/pocas unidades/seleccionado), precio con tachado y % descuento, disponibilidad por sucursal, descripción completa, guía de tallas, recomendaciones ("también te puede gustar"), botón compartir, sticky add-to-cart en mobile, botón "consultar por WhatsApp" cuando no hay stock.

**Carrito.** Línea por variante (imagen, nombre, color, talla, cantidad editable, subtotal, eliminar), subtotal y total estimado, aviso claro de que el precio final se confirma por WhatsApp, CTA "Finalizar pedido" (nunca "Pagar").

**Checkout.** Máximo 2–3 pasos/pantallas: (1) datos del cliente + entrega, (2) pago preferido + resumen, con posibilidad de completarlo en una sola pantalla larga si el testing de UX lo favorece. Validación en tiempo real, prellenado si el navegador ya tiene datos guardados (sin cuenta), manejo explícito de error si stock cambió durante el checkout.

**Confirmación.** Muestra el número de pedido, resumen, y reintento del botón de WhatsApp por si no se abrió la primera vez, más opción de copiar el mensaje/número.

**Tiendas.** Tarjeta por sucursal con foto, dirección, mapa embebido, horario, teléfono/WhatsApp, servicios (retiro/delivery). Cada una con su propia landing SEO.

**Admin — cualquier pantalla de listado (productos, pedidos, clientes, inventario).** Búsqueda, filtros, ordenamiento, paginación, acciones en bloque donde aplique, exportación.

---

## 8. Requisitos no funcionales

**Performance:** LCP < 2.5s en 4G/gama media, CLS < 0.1, INP < 200ms, Lighthouse mobile > 90 en páginas públicas clave. Presupuesto de JS estricto en Home/Catálogo/Producto.

**Seguridad:** ver sección 23 completa. Regla base: ninguna decisión de negocio (precio, stock, rol) se toma confiando en el cliente.

**Disponibilidad:** objetivo 99.5% (razonable para esta etapa; no se requiere infraestructura multi-región).

**Accesibilidad:** contraste AA, navegación por teclado en checkout y admin, alt text obligatorio en imágenes de producto, componentes con roles ARIA donde el HTML semántico no baste.

**Compatibilidad:** Chrome Android, Samsung Internet, Safari iOS, Chrome/Edge/Safari desktop. Grados de degradación aceptable en navegadores muy antiguos (no soporte activo, pero no debe romperse visualmente).

**Internacionalización:** fuera de alcance por ahora (español, Venezuela). La arquitectura de textos no debe impedirlo a futuro, pero no se construye i18n en el MVP.

**Mantenibilidad:** TypeScript estricto, componentes pequeños y con responsabilidad única, sin datos de negocio hardcodeados (regla permanente del proyecto), documentación mínima de decisiones no obvias.

---

## 9. Arquitectura frontend

Aplicación **Next.js con App Router**, renderizado híbrido: páginas de catálogo/categoría/colección con **ISR** (revalidación periódica + revalidación bajo demanda cuando el admin publica cambios), ficha de producto con ISR similar, Home con ISR corto dado que cambia con banners/secciones, carrito/checkout/favoritos como **client-side** sobre datos server-fetched (dependen de sesión/stock en tiempo real), admin como aplicación autenticada renderizada dinámicamente (sin caché pública).

Capas: `app/(public)` para el sitio público, `app/admin` para el dashboard (layout separado, con su propio middleware de autenticación), `app/api` (o Route Handlers) para endpoints que el propio frontend consume, y una capa de dominio (`/lib`, `/server`) donde vive la lógica de negocio (pricing, inventario, checkout) desacoplada de la capa HTTP para poder testearla sin levantar rutas.

Estado del carrito: fuente de verdad en base de datos (tabla `carts`/`cart_items` asociada a un `session_id` en cookie httpOnly), con una copia en memoria/Zustand para UI instantánea; toda mutación relevante (agregar, quitar, cambiar cantidad) se sincroniza con el servidor de forma optimista con reconciliación si el servidor corrige algo (p. ej. stock insuficiente).

Theming: tokens de diseño (colores, tipografía, radios, spacing) leídos desde configuración de "Branding" en build/runtime vía variables CSS, de forma que cambiar la apariencia no requiera tocar componentes. Plantillas (Minimal/Fashion/Premium/Bold) se modelan como variantes del mismo design system (mismos componentes, distintos tokens y, como mucho, distintas variantes de layout en Home), nunca como copias de lógica de negocio.

---

## 10. Arquitectura backend

Backend basado en **Postgres (vía Supabase)** con lógica de negocio crítica ejecutada en el servidor (Route Handlers/Server Actions de Next.js), nunca en el cliente. Tres franjas de responsabilidad:

1. **Acceso a datos:** Postgres con Row Level Security (RLS) activado como segunda capa de defensa — incluso si un endpoint tuviera un bug, RLS impide que un usuario público lea/escriba lo que no le corresponde (p. ej., un cliente anónimo no puede leer pedidos de otros, un rol "ventas" no puede modificar costos).
2. **Lógica de negocio server-side:** un módulo de dominio encargado de recalcular precios, verificar stock con locking, generar IDs de pedido, aplicar reglas de moneda, y construir el mensaje de WhatsApp. Este módulo es el único que puede escribir en `orders`.
3. **Autenticación y autorización:** Supabase Auth para el panel admin (email/password + opción de 2FA), con tabla de roles/permisos propia (no basta el rol nativo de Supabase) para el modelo granular de la sección 20.

Trabajos programados (cron): liberar reservas de stock vencidas, recalcular/registrar histórico de tasa de cambio si se automatiza a futuro, limpiar carritos abandonados muy antiguos, generar reportes agregados nocturnos para el dashboard ejecutivo (para no calcular KPIs pesados en cada request).

---

## 11. Stack recomendado

| Capa                 | Elección                                                                                                                                                      | Por qué                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | Next.js (App Router) + TypeScript estricto                                                                                                                    | SSR/ISR out-of-the-box para SEO y performance, Route Handlers para backend ligero sin infraestructura aparte, ecosistema maduro, buen soporte en Vercel.                                                                                                                                                                                                                            |
| UI                   | Tailwind CSS + shadcn/ui                                                                                                                                      | Velocidad de desarrollo, componentes accesibles por defecto, fácil de themear con tokens (necesario para branding/plantillas), sin licencias.                                                                                                                                                                                                                                       |
| Base de datos        | PostgreSQL (vía Supabase)                                                                                                                                     | Relacional, soporta bien el modelo de variantes/inventario, RLS nativo, full-text search + `pg_trgm` para búsqueda tolerante a errores sin pagar un servicio externo desde el día uno.                                                                                                                                                                                              |
| Backend/Auth/Storage | Supabase (Postgres + Auth + Storage + Edge Functions)                                                                                                         | Reduce infraestructura a mantener para un equipo pequeño; Auth con RLS resuelve roles/permisos de forma robusta; Storage + transformación de imágenes cubre multimedia sin otro proveedor. Alternativa evaluada: backend propio (Node/Nest) + Postgres gestionado — más control pero más tiempo de construcción y mantenimiento; no se justifica para el tamaño actual del negocio. |
| Imágenes             | Supabase Storage + optimización vía `next/image`; evaluar Cloudinary si se necesitan transformaciones avanzadas (crops por variante, watermarks) más adelante | Empezar simple, con ruta clara de upgrade sin cambiar el modelo de datos (las imágenes se referencian por URL, el proveedor es intercambiable).                                                                                                                                                                                                                                     |
| Hosting              | Vercel                                                                                                                                                        | Integración nativa con Next.js, ISR, edge caching, preview deployments por PR (útil para que el dueño revise cambios de home/banners antes de publicarlos).                                                                                                                                                                                                                         |
| Analítica            | GA4 + Meta Pixel/CAPI + TikTok Pixel + tabla propia de `analytics_events`                                                                                     | Los pixeles externos dan alcance de campañas; la tabla propia da control total sobre el embudo interno (búsquedas sin resultado, tasa carrito→checkout, etc.) que ninguna herramienta externa mide igual de bien para este negocio.                                                                                                                                                 |
| Búsqueda             | Postgres full-text + `pg_trgm` (MVP) → evaluar Meilisearch/Typesense si el catálogo supera ~5,000 SKUs o se requiere autocompletado más sofisticado           | No pagar un servicio de búsqueda dedicado antes de necesitarlo; la interfaz de búsqueda se diseña para poder cambiar de motor sin tocar el frontend (contrato de búsqueda desacoplado).                                                                                                                                                                                             |

**Alternativas descartadas y por qué:** WordPress/WooCommerce (rígido para el modelo de variantes+inventario por sucursal y para un dashboard a medida orientado a WhatsApp); Shopify (excelente para ecommerce con pago en línea, pero cobra por volumen y su modelo de checkout está pensado para pago con tarjeta, no para "checkout que termina en WhatsApp" — se puede lograr con apps de terceros pero se pierde control y se generan dependencias/costos recurrentes innecesarios en esta etapa); backend serverless "custom" sin Postgres relacional (Firebase/Firestore) — el modelo de inventario por variante×sucursal con locking transaccional necesita garantías relacionales/transaccionales que un modelo documental no da con la misma naturalidad.

---

## 12. Base de datos (entidades, campos clave, relaciones)

_(Modelo relacional en Postgres. Se listan campos clave, no el DDL completo — eso corresponde a la fase de implementación con migraciones versionadas.)_

### Identidad y acceso

- **users** — id, email, password_hash (gestionado por Supabase Auth), full_name, phone, active, created_at. 1:N con `user_roles`.
- **roles** — id, name (super_admin, admin, inventory, sales…), description.
- **permissions** — id, key (ej. `products.edit`, `orders.change_status`), description.
- **role_permissions** — role_id, permission_id (N:M, granularidad futura).
- **user_roles** — user_id, role_id, store_id nullable (permite limitar un usuario a una sucursal).
- **audit_logs** — id, user_id, action, entity_type, entity_id, before jsonb, after jsonb, created_at.

### Empresa y configuración

- **company** — id, legal_name, trade_name, rif, description, email, phone, whatsapp_main, instagram, facebook, tiktok, website, address, google_maps_url.
- **company_settings** — key/value tipado (jsonb) para ajustes no estructurales: visibilidad de stock (A/B/C/D, sección 17), estrategia de WhatsApp (sección 31), moneda por defecto, redondeo, etc. Preferido sobre columnas sueltas para poder agregar ajustes sin migración.
- **themes** — id, name, tokens jsonb (colores, tipografía, radios), active_template.

### Sucursales

- **stores** — id, name, code, slug, address, city, state, lat, lng, google_maps_url, phone, whatsapp, pickup_enabled, delivery_enabled, active.
- **store_hours** — store_id, day_of_week, opens_at, closes_at, closed boolean.

### Catálogo

- **brands** — id, name, slug, logo_url, description, website, active.
- **categories** — id, name, slug, description, image_url, banner_url, parent_id nullable, seo_title, seo_description, order, active. Autorreferencia para árbol de categorías.
- **collections** — id, name, slug, description, type (manual|rule_based), rule jsonb (para colecciones por reglas: categoría, precio, tags…), active.
- **collection_products** — collection_id, product_id, order (solo para colecciones manuales).
- **products** — id, name, slug, sku, brand_id, category_id, collection_ids (via tabla intermedia), gender, description_short, description, material, tags text[], status (draft|published|hidden|archived), badge_custom, is_new, is_featured, is_bestseller, seo_title, seo_description, og_image_url, created_at, updated_at, deleted_at (soft delete).
- **product_images** — id, product_id, url, alt_text, order, is_primary.
- **product_options** — id, product_id, name (Color, Talla, Material…), order. Permite opciones futuras sin cambiar esquema.
- **product_option_values** — id, option_id, value, extra jsonb (ej. hex color, order-ing de talla).
- **product_variants** — id, product_id, sku, option_value_ids (via tabla intermedia `variant_option_values`), price_usd, compare_at_price_usd, cost_usd nullable, status, barcode nullable.
- **variant_option_values** — variant_id, option_value_id (N:M — cada variante es una combinación de valores de opciones).
- **variant_images** — variant_id, image_id (referencia a `product_images`, para reusar fotos por color).
- **size_charts** — id, name, category_id nullable, gender nullable, rows jsonb (tabla de equivalencias EU/US/UK/cm).
- **redirects** — id, entity_type, entity_id, old_slug, new_slug, created_at. Se crea automáticamente cada vez que cambia el slug de un producto/categoría/colección publicado, para servir un 301 y no perder SEO ni enlaces ya compartidos.

### Inventario

- **inventory** — id, variant_id, store_id, quantity_on_hand, updated_at. Único por (variant_id, store_id). Este es el número "físico" real.
- **inventory_reservations** — id, variant_id, store_id, order_id, quantity, expires_at, status (active|converted|released), created_at. `available = quantity_on_hand - SUM(reservations activas)`.
- **inventory_movements** — id, variant_id, store_id, type (entrada|salida|ajuste|transferencia|venta|liberación), quantity_delta, reason, reference_order_id nullable, user_id, previous_quantity, new_quantity, created_at.
- **stock_transfers** — id, variant_id, from_store_id, to_store_id, quantity, status, requested_by, received_by, created_at, completed_at.
- **restock_notifications** — id, variant_id, store_id nullable, customer_id/email/phone, notified boolean, created_at. (Soporta "avísame cuando esté disponible", V1.1.)

### Precios y monedas

- **currencies** — id, code (USD, VES, EUR), symbol, decimals, is_base. EUR se incluye desde el MVP para soportar la tasa BCV euro.
- **exchange_rates** — id, currency_pair (USD/VES, EUR/VES), rate, source (manual | dolarapi | pydolarve | bcvapi | otro), fetched_at, effective_at, is_automatic, created_by nullable, created_at. Se usa siempre la tasa vigente del par configurado (`company_settings.ves_reference_currency`) al momento del pedido, y **se snapshotea** en el pedido (ver `orders.exchange_rate_used`). Ver sección 15 para el diseño completo del adaptador `ExchangeRateProvider`.
- **exchange_rate_fetch_logs** — id, provider, success boolean, http_status nullable, error_message nullable, created_at. Permite diagnosticar si un proveedor de tasa BCV dejó de responder, sin mezclar ese ruido con la tabla de tasas válidas.
- **price_rules** — id, name, type (percentage|fixed|fixed_price), target_type (product|variant|category|collection), target_id, starts_at, ends_at, active, priority. Base para ofertas/promos; deja espacio para 2x1/cupones en el futuro sin rehacer el modelo.
- **price_history** — id, variant_id, old_price_usd, new_price_usd, changed_by, changed_at (V1.1, útil para auditoría y para no mostrar "descuento falso").

### Clientes

- **customers** — id, first_name, last_name nullable, phone (normalizado E.164), whatsapp_phone nullable, email nullable, city, state, address, first_order_at, last_order_at, orders_count, total_spent_usd, source jsonb (utms de la primera captación), created_at, deleted_at.
- **customer_addresses** — id, customer_id, label, state, city, municipality, address, reference, is_default.
- **favorites** — id, customer_id nullable, session_id nullable, variant_id o product_id, created_at. Soporta favoritos anónimos (localStorage + tabla espejo) migrables a cuenta en el futuro.

### Carrito

- **carts** — id, session_id, customer_id nullable, status (active|converted|abandoned), created_at, updated_at.
- **cart_items** — id, cart_id, variant_id, quantity, unit_price_snapshot_usd (referencial, se recalcula siempre en checkout), added_at.

### Pedidos

- **orders** — id, order_number (ZOE-YYYY-NNNNNN, único, humano), public_access_token (UUID, único, **no secuencial** — ver sección 23: el `order_number` nunca debe alcanzar por sí solo para consultar el pedido públicamente), customer_id, store_id nullable (si es retiro), status, subtotal_usd, discount_usd, shipping_estimate_usd, total_usd, exchange_rate_used, exchange_rate_currency_pair, exchange_rate_source, delivery_method (pickup|delivery|shipping), delivery_address_id nullable, shipping_zone_id nullable, payment_method_id, payment_notes, source jsonb (utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, ttclid, referrer), idempotency_key (único), whatsapp_number_used, whatsapp_message_sent text, whatsapp_opened_at, created_at, updated_at.
- **order_items** — id, order_id, variant_id (referencia, puede ser null si el producto se borra), **snapshot**: product_name, sku, variant_label (ej. "Negro / 38"), unit_price_usd, discount_usd, quantity, subtotal_usd, image_url_snapshot. Este snapshot es lo que se muestra siempre, no se recalcula desde el producto actual.
- **order_status_history** — id, order_id, from_status, to_status, changed_by (user_id o "system"), note, created_at.
- **order_notes** — id, order_id, user_id, note, created_at (interno, no visible al cliente).

### Comercial / configuración operativa

- **payment_methods** — id, name, instructions, active, order, store_ids (nullable = todas).
- **shipping_methods** — id, name (pickup|delivery|carrier), active.
- **shipping_zones** — id, name, city, sectors text[], cost_usd, active.
- **shipping_carriers** — id, name, active, notes (MRW, Zoom, etc. — datos, no código).

### Marketing / contenido

- **banners** — id, name, image_desktop_url, image_mobile_url, headline, copy, cta_label, cta_url, position, starts_at, ends_at, priority, active.
- **home_sections** — id, type (hero|banner|categories|product_slider|collection|image_text|cta|brands|features|testimonials|instagram|stores), title, subtitle, config jsonb (selección manual de productos o regla automática), order, active.
- **whatsapp_templates** — id, name, template text (con placeholders controlados), active.

### Búsqueda y analítica

- **search_logs** — id, query, results_count, session_id, created_at.
- **analytics_events** — id, event_type, session_id, customer_id nullable, entity_type nullable, entity_id nullable, metadata jsonb, utm_* , referrer, created_at.
- **integrations** — id, provider (ga4|gtm|meta_pixel|meta_capi|tiktok|google_ads|bcv_rate_provider), public_config jsonb, secret_ref (referencia a variable de entorno/secret manager, **nunca el secreto en la tabla en texto plano** accesible por RLS pública). Al mostrarse en el admin después de guardado, cualquier token se enmascara (ej. `••••••••ABC`) y solo se reemplaza, nunca se vuelve a exponer completo.

### Importación

- **import_batches** — id, profile (ej. `fina`, `csv_generic`, `xlsx_generic`), file_name, file_checksum, status (pending|validated|applied|failed|rolled_back), total_rows, valid_rows, error_rows, dry_run boolean, applied_by, created_at, applied_at. Cada importación queda asociada a un lote (`batch_id`) para poder responder siempre "qué archivo produjo qué cambios".
- **import_row_results** — id, batch_id, row_number, raw_data jsonb, matched_entity_type nullable, matched_entity_id nullable, action (create|update|skip|error), errors jsonb nullable.

El motor de importación (`ImportEngine`) es **genérico** y trabaja por **perfiles**: un perfil define cómo mapear las columnas de un archivo de origen a las entidades del catálogo. **Fina** (el sistema que Zoe usa/usaba para gestionar productos e inventario) es solo **un perfil/adaptador más**, no una dependencia del núcleo — el `ImportEngine` no sabe nada de Fina específicamente, solo sabe leer "perfiles de mapeo". Esto permite agregar en el futuro un perfil distinto (otro sistema, otra tienda) sin tocar el motor. Todo archivo importado sigue siempre el flujo `Upload → Parse → Validate → Match → Diff → Preview → Confirm → Apply`, nunca se aplica directamente sobre producción, soporta _dry run_ (ver qué pasaría sin aplicar nada), es idempotente por checksum/SKU/ID externo (subir el mismo archivo dos veces no duplica productos), y distingue explícitamente entre un **snapshot completo** (todo lo ausente se interpreta como stock 0, solo si el propio perfil lo declara así) y una **actualización parcial** (lo ausente simplemente no se toca) — nunca se asume una de las dos por defecto sin que el perfil lo declare.

**Índices importantes:** `products(slug)` único, `products(status, category_id)`, `product_variants(sku)` único, `inventory(variant_id, store_id)` único, `orders(order_number)` único, `orders(idempotency_key)` único, `orders(customer_id, created_at)`, `analytics_events(event_type, created_at)`, `search_logs(created_at)`, índice `pg_trgm` sobre `products(name)` y `products(tags)` para búsqueda tolerante a errores.

---

## 13. Modelo de producto y variantes (detalle)

Un producto es la entidad "vendible" a nivel conceptual (ej. "Nike Air XYZ"). Sus **opciones** (Color, Talla, y cualquier opción futura como Material) están modeladas como entidades propias, no como columnas fijas — así, agregar una tercera opción (ej. "Ancho") en el futuro no requiere cambiar el esquema. Cada **combinación válida** de valores de opciones es una **variante**, y es la variante — no el producto — la unidad real de precio, SKU, imagen y stock.

Esto significa: "Nike Air XYZ / Negro / 38" es un registro `product_variants` con su propio SKU y su propio precio (permitiendo, por ejemplo, que una talla especial cueste distinto). El stock de esa variante se maneja por sucursal en la tabla `inventory`, no en la variante misma, porque el mismo par de zapatos puede tener 2 unidades en Centro y 0 en Av. Bolívar.

Las imágenes se asocian primero al producto; las variantes de color pueden apuntar a un subconjunto de esas imágenes (`variant_images`) para que, al cambiar de color, la galería cambie sin duplicar archivos.

No se permite comprar una combinación sin stock: el selector de talla se deshabilita visualmente, y el servidor la rechaza igual aunque el frontend fallara en deshabilitarla.

---

## 14. Sistema de inventario (detalle)

**Modelo:** `Product → Variant → Location(Store) → Stock`, con movimientos auditables (`inventory_movements`) para cada cambio, y transferencias (`stock_transfers`) como flujo propio (salida de una tienda + entrada en otra, atómico).

**Disponibilidad real:** `available = quantity_on_hand − reservas_activas`. El frontend nunca lee `quantity_on_hand` directamente para decidir si mostrar "disponible"; siempre lee la disponibilidad calculada.

**Reserva temporal (sección 51 del brief):** no se reserva stock solo por estar en el carrito (eso bloquearía inventario indefinidamente con carritos abandonados, que son la mayoría). Se reserva **únicamente en el momento en que se registra el pedido** (al pulsar "Enviar pedido por WhatsApp"), por una ventana corta —recomendado **15 a 30 minutos**—, tiempo razonable para que la vendedora confirme por WhatsApp. Un job programado libera automáticamente las reservas vencidas cuyo pedido siga sin confirmarse. Cuando la vendedora marca el pedido como "Confirmado" o "Pagado", la reserva se convierte en una salida definitiva de inventario (movimiento tipo "venta"). Si la vendedora marca "Cancelado", la reserva (si aún activa) se libera de inmediato.

**Concurrencia (dos clientes, última talla 38):** al crear la reserva, el servidor abre una transacción y bloquea la fila de `inventory` correspondiente (`SELECT ... FOR UPDATE`) antes de verificar disponibilidad y escribir la reserva. El segundo request que llegue casi simultáneamente esperará el lock, verá la disponibilidad ya actualizada (0), y recibirá un error claro ("esa talla se agotó hace un momento") en vez de crear un pedido inválido. Esto evita condiciones de carrera sin necesitar un sistema externo de colas para el volumen esperado de este negocio.

**Visibilidad pública del stock:** configurable (sección 17 del brief) entre cantidad exacta, "disponible" genérico, mensaje de urgencia ("últimas 2 unidades") o stock oculto. Recomendado para Zoe: urgencia cuando quedan ≤3 unidades, "disponible" en otro caso — genera conversión sin exponer niveles exactos de inventario a la competencia.

---

## 15. Sistema de monedas

Moneda base de precios: **USD** (práctica estándar del retail venezolano). Decisión confirmada por el negocio: **el precio se muestra siempre en USD y en Bs al mismo tiempo** (`$39.99 / Bs. XX.XXX,XX`) en catálogo, producto, carrito, checkout y mensaje de WhatsApp — no como una alternancia que el cliente deba activar. El modo de visualización se mantiene configurable en `company_settings.price_display_mode` (solo USD / solo VES / ambas) por flexibilidad futura, pero **"ambas" es el valor por defecto y el que se lanza en el MVP**.

**Tasa de cambio con fuente automática BCV.** Esta es una funcionalidad confirmada como importante para el negocio: el sistema debe traer automáticamente la tasa oficial del Banco Central de Venezuela — dólar **y** euro — y usarla para calcular el equivalente en bolívares. Un punto técnico honesto que hay que dejar explícito, siguiendo la regla del proyecto de _"no inventar APIs"_ (nunca asumir un endpoint no confirmado): **el BCV no publica una API REST oficial propia**; su tasa se publica en su sitio web (bcv.org.ve). Por eso la arquitectura no se ata hoy a una URL específica, sino a una **interfaz `ExchangeRateProvider`** con implementaciones intercambiables:

1. **`manual`** — el admin escribe la tasa a mano desde `Finanzas → Monedas`. Fallback siempre disponible, nunca deja de funcionar aunque todo lo demás falle.
2. **`bcv_automatic`** — un adaptador que consulta una fuente que republica la tasa oficial del BCV. En la investigación hecha para este documento se confirmaron varios servicios activos y de uso común en la comunidad de desarrollo venezolana que exponen la tasa BCV (dólar y euro) vía API: **DolarApi.com** (`dolarapi.com/docs/venezuela`), **pydolarve.org**, y **BCV API** (`bcvapi.tech`), entre otros. Ninguno de ellos _es_ el BCV — son terceros que scrapean/republican el dato oficial — así que **cuál usar en producción (y con qué respaldo si el principal falla) es una decisión técnica que se valida con una investigación corta en la Fase 0** del roadmap (evaluar uptime, límites de uso, costo, y si exponen euro además de dólar), no algo que deba resolverse en esta fase de planificación. Se recomienda configurar **más de un proveedor con orden de prioridad** (si el primero no responde, se intenta el segundo antes de caer al último valor conocido).

**Cómo se aplica la tasa (evitando una doble conversión inconsistente).** `company_settings.ves_reference_currency` (**USD** o **EUR**, configurable por el admin en el dashboard, tal como se pidió) determina qué par de tasa BCV se usa para calcular el equivalente en bolívares de cada precio:

- Si la referencia es **USD** (recomendado, valor por defecto): `precio_bs = precio_usd × tasa_BCV_USD→VES`. Conversión directa y confiable, porque el precio del producto ya está almacenado en USD.
- Si la referencia es **EUR**: como el precio del producto sigue almacenado en USD, se necesitaría además una tasa de mercado USD/EUR para convertir primero a euros y luego aplicar la tasa BCV EUR→VES — un paso extra y una fuente de error adicional (dos tasas combinadas en vez de una). Queda disponible porque el negocio lo pidió, pero se documenta como **trade-off explícito**: si a futuro Zoe realmente necesita productos cuyo costo nace en euros (ej. calzado europeo), lo más limpio sería permitir una `base_currency` por producto en vez de encadenar conversiones — se anota como mejora de V1.1/V2 y no se construye ahora por no ser, todavía, un problema real.

**Histórico y trazabilidad.** Cada tasa obtenida (manual o automática) se guarda en `exchange_rates` con `currency_pair` (USD/VES, EUR/VES), `rate`, `source` (`manual` | `dolarapi` | `pydolarve` | `bcvapi` | otro), `fetched_at` y si fue automática o corregida manualmente. Un job programado refresca la tasa automática con frecuencia configurable (recomendado cada 1–4 horas, dado que el BCV típicamente publica una vez por día hábil), y el dashboard siempre muestra **cuándo fue la última actualización exitosa** para que el equipo note si la fuente dejó de responder.

**Snapshot en pedidos.** El pedido siempre congela la tasa usada en el momento (`orders.exchange_rate_used`, `orders.exchange_rate_currency_pair`, `orders.exchange_rate_source`). Una actualización de tasa posterior —automática o manual— **nunca** modifica el monto en bolívares de un pedido ya creado; esto es explícitamente una regla permanente del proyecto (no alterar pedidos históricos por cambios de tasa).

**Resiliencia.** Si el proveedor automático falla o no responde, el sistema **no bloquea el catálogo ni el checkout**: sigue mostrando precios con la última tasa válida conocida (con su fecha visible) y, si esa tasa supera una antigüedad configurable (ej. 48 horas), se alerta al admin para que la confirme o actualice a mano — el negocio nunca deja de vender por una integración externa caída. Se aplican timeout y reintentos razonables al llamar al proveedor externo, nunca una espera indefinida.

Sources: [DolarApi.com — Venezuela](https://dolarapi.com/docs/venezuela/), [BCV API](https://www.bcvapi.tech/), [Banco Central de Venezuela](https://www.bcv.org.ve/)

---

## 16. Sistema de checkout

Checkout sin cuenta obligatoria (guest). Campos mínimos: nombre, teléfono/WhatsApp (se recomienda **un solo campo** con prefijo `+58` editable a otros países, en vez de duplicar "teléfono" y "WhatsApp" — reduce fricción; se puede ofrecer un checkbox "mi WhatsApp es otro número" solo si en la práctica se detecta que hace falta). Entrega condicional: si es retiro, se piden sucursal (no dirección); si es delivery/envío, se piden estado/ciudad/dirección/punto de referencia, con la zona de delivery determinando si aplica costo.

**Antes de tocar WhatsApp, el servidor siempre:** valida el carrito contra catálogo actual, valida inventario con locking, recalcula todos los precios y el total desde la base de datos (nunca confía en lo que mandó el navegador), crea/actualiza el registro del cliente, crea el pedido con sus líneas (snapshot), guarda la fuente de tráfico, genera el ID único, registra el evento de conversión "Lead"/"Pedido solicitado", genera el mensaje de WhatsApp, y **solo entonces** abre WhatsApp.

**Idempotencia:** al entrar a `/checkout`, el cliente genera (o recupera de `sessionStorage`) una `idempotency_key` (UUID) única para ese intento de pedido. Esa clave se envía junto con la solicitud de creación de pedido. `orders.idempotency_key` tiene una restricción única: si el usuario hace doble clic, pierde conexión y reintenta, o el navegador reenvía el formulario, el servidor detecta la clave repetida y **devuelve el pedido ya creado** en lugar de duplicarlo. La clave se regenera solo cuando el carrito cambia sustancialmente o el usuario reinicia el flujo.

---

## 17. Sistema WhatsApp

**Generación del enlace:** se construye un enlace `https://wa.me/<numero>?text=<mensaje codificado>` (compatible con Android, iOS, WhatsApp Web y escritorio), evitando el esquema `whatsapp://` como único método porque no funciona en desktop/web. Se intenta abrir en una nueva pestaña/redirección; si no se detecta interacción (popup bloqueado, WhatsApp no instalado), se muestra de inmediato —sin esperar a que "falle"— un bloque con el mensaje completo y dos botones: **Copiar pedido** y **Copiar número de WhatsApp**, además del enlace visible para tocar manualmente.

**Enrutamiento por sucursal (decidido):** el mensaje siempre se envía al **WhatsApp configurado en la sucursal elegida** por el cliente durante el checkout (`company_settings.whatsapp_routing_strategy = by_store`, confirmado como estrategia única del MVP). Si la entrega es delivery/envío nacional (no hay sucursal de retiro asociada), o si la sucursal elegida no tiene un número propio configurado, el sistema cae de forma automática al **WhatsApp principal de la empresa** como respaldo — para que ningún pedido quede sin un número al cual enviarse. La estrategia se guarda igualmente como un enum abierto (`by_store`, y en el futuro `always_main`, por categoría, por stock) para no rediseñar el modelo si el negocio decide cambiar de criterio más adelante, aunque hoy solo se implementa `by_store` con el respaldo descrito.

**Mensaje:** generado 100% en servidor a partir de los datos reales del pedido, usando una plantilla editable por el admin (`whatsapp_templates`) con **placeholders controlados** (`{{order_number}}`, `{{customer_name}}`, `{{items}}`, `{{subtotal}}`, `{{total}}`, `{{delivery_method}}`, `{{store}}`, `{{payment_method}}`). El admin puede editar el texto alrededor de los placeholders (saludo, despedida, tono), pero no puede alterar los datos que representan — el motor de render sustituye los placeholders después de que el admin guarda la plantilla, y sanitiza cualquier texto libre que el admin agregue (sin HTML, sin caracteres de control) para que el mensaje llegue limpio a WhatsApp.

---

## 18. Sistema de pedidos

**Generación del ID:** formato `ZOE-YYYY-NNNNNN`. Se implementa con una tabla `order_number_sequences(year, last_value)`; al crear un pedido, dentro de la misma transacción se hace `UPDATE ... SET last_value = last_value + 1 WHERE year = <año actual> RETURNING last_value` (con bloqueo de fila implícito de Postgres), garantizando unicidad y orden creciente incluso con alta concurrencia, sin depender de IDs autoincrementales expuestos directamente (que revelarían volumen total de pedidos a cualquiera que mire dos números consecutivos). Si no existe fila para el año, se crea con valor 1 la primera vez.

**Estados:** Nuevo → Enviado a WhatsApp → Contactado → Confirmado → Esperando pago → Pagado → Preparando → Listo para entregar → Enviado → Entregado, con Cancelado como salida posible desde cualquier estado previo a Entregado. Cada cambio se registra en `order_status_history` con usuario y nota opcional. Los estados se modelan como catálogo (no enum rígido en código) para poder ajustarlos desde configuración si el negocio lo requiere, aunque el MVP los trae precargados como semilla.

**Notas internas:** cualquier usuario admin puede dejar notas en el pedido (no visibles al cliente), útiles para casos como "cliente pidió cambiar talla 38 por 39".

---

## 19. Dashboard

Estructura de navegación agrupada (ver también sección "Panel de configuración" más abajo): **Inicio** (KPIs), **Pedidos**, **Clientes**, **Catálogo** (Productos, Categorías, Marcas, Colecciones, Tallas, Colores), **Inventario** (Stock, Movimientos, Transferencias), **Marketing** (Home, Banners, Promociones), **Finanzas** (Monedas, Métodos de pago), **Entrega** (Pickup, Delivery, Envíos), **Canales** (WhatsApp, Redes sociales), **Integraciones** (Analytics), **Apariencia** (Branding, Plantilla), **Sistema** (Usuarios, Roles, Logs, Backups).

El dashboard principal muestra KPIs de hoy/semana/mes con comparación contra el período anterior: pedidos, monto solicitado, pedidos confirmados, tasa de conversión del embudo, productos más solicitados/vistos/agregados al carrito, productos sin stock, búsquedas principales y sin resultados, sucursal con más pedidos, fuente de tráfico principal. Gráficos de pedidos por día, ventas por sucursal, por categoría y por fuente.

Formularios largos (como el de producto) se organizan en pestañas/secciones con guardado de borrador y vista previa, siguiendo el principio de que el personal no técnico debe poder operar el sistema sin fricción (sección 91).

---

## 20. Roles y permisos

Roles iniciales: **Super Admin** (todo, incluida configuración del sistema y usuarios), **Administrador** (catálogo, pedidos, clientes, marketing — sin acceso a usuarios/sistema/finanzas sensibles), **Inventario** (solo módulo de inventario y lectura de catálogo), **Ventas** (pedidos, clientes, WhatsApp — sin edición de catálogo ni precios). La arquitectura usa una tabla de permisos granulares (`permissions`/`role_permissions`) desde el día uno aunque el MVP solo exponga la asignación por rol predefinido en la interfaz — esto evita una migración de esquema dolorosa cuando en V1.1/V2 se pida permisos a medida por usuario.

La autorización se aplica en **tres capas**: UI (oculta acciones no permitidas, por UX), API (rechaza la acción si el usuario no tiene el permiso, por seguridad real) y base de datos vía RLS (última línea de defensa). Ninguna capa confía únicamente en la anterior.

---

## 21. Analytics

**Eventos internos** (`analytics_events`): `page_view`, `view_product`, `search`, `filter_applied`, `view_category`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `checkout_completed` (pedido registrado en servidor), `whatsapp_clicked`, `favorite_added`. Cada evento lleva `session_id`, `customer_id` si ya se conoce, `metadata` y los UTM/click-ids capturados al aterrizar. Para evitar duplicados, cada evento se emite con un `client_event_id` (UUID generado en el cliente) que actúa como clave de deduplicación del lado servidor dentro de una ventana corta.

**Embudo medido:** Visita → Producto → Agregar al carrito → Checkout → Enviado a WhatsApp → Confirmado → Venta (Pagado/Entregado). El dashboard ejecutivo calcula las tasas de conversión entre cada paso, permitiendo responder directamente las preguntas de negocio del punto 121 del brief (talla que más se vende, sucursal top, campaña top, búsquedas sin resultados, etc.).

**Carritos abandonados:** se identifican por eventos (`begin_checkout` sin `checkout_completed` posterior en una ventana de tiempo) únicamente con fines analíticos en el MVP — sin mensajes automáticos ni prácticas invasivas, respetando el punto 95 del brief. Se deja preparado el modelo (cliente + carrito + consentimiento) para una eventual recuperación opt-in en V1.1 (ej. "¿Quieres que te enviemos tu carrito por WhatsApp?").

---

## 22. SEO

URLs limpias y estables (`/producto/slug`, `/categoria/slug`) — el `slug` es una propiedad de SEO/URL, nunca el identificador interno real (las relaciones en base de datos siempre usan el `id`, nunca el slug); si un slug cambia, el producto/categoría conserva su `id` y el sistema crea automáticamente una redirección 301 desde el slug anterior para no perder posicionamiento ni romper enlaces ya compartidos en redes sociales, y se garantiza unicidad de slugs por tipo de entidad al guardarlos. Canonical explícito en cada página, metadata (title/description) editable por entidad, Open Graph y Twitter Cards con imagen del producto, `sitemap.xml` generado dinámicamente (productos publicados, categorías, colecciones activas, tiendas), `robots.txt` administrable, breadcrumbs visibles y con Schema.org (`BreadcrumbList`), y datos estructurados `Product`/`Offer` en ficha de producto, `Organization`/`LocalBusiness` en Home/tiendas.

**Filtros y duplicidad:** las combinaciones de filtros en `/catalogo` generan URLs con query params que **no se indexan** (`noindex` cuando hay más de N filtros combinados, o cuando el resultado replica el contenido de una categoría ya indexable); las categorías y colecciones "canónicas" sí son indexables. Paginación con `rel=next/prev` o, si se usa infinite scroll, con una versión paginada indexable en paralelo (patrón "load more" que además genera URLs de página real para los bots).

**SEO local:** cada sucursal tiene su propia landing (`/tiendas/centro-valencia`) con `LocalBusiness` schema, horario, dirección y NAP consistente (nombre/dirección/teléfono iguales en todo el sitio y en Google Business Profile) — clave para posicionar búsquedas tipo "zapatería cerca de mí" en Valencia.

---

## 23. Seguridad

Regla rectora del proyecto (ya definida en las instrucciones permanentes): **el frontend nunca es fuente de verdad.** Precio, stock, rol, moneda y total siempre se recalculan en servidor antes de crear un pedido.

Medidas concretas: autenticación de admin vía Supabase Auth con opción de 2FA para roles sensibles (Super Admin/Administrador), rutas `/admin/*` protegidas por middleware que verifica sesión y rol en cada request (no solo al cargar la página), `noindex` explícito en todo `/admin`, RLS en todas las tablas sensibles, validación de todo input externo con schemas compartidos entre frontend y backend (mismo schema, dos usos), sanitización antes de guardar (trim/normalize), protección contra XSS (sin `dangerouslySetInnerHTML` sin sanitizar, escape de placeholders del mensaje de WhatsApp), prevención de SQL injection por diseño (ORM/query builder parametrizado, nunca concatenación de strings), subida de archivos restringida por tipo/tamaño con reprocesamiento server-side de imágenes (nunca servir el archivo subido tal cual sin validar), cabeceras de seguridad (CSP, HSTS, X-Frame-Options), rate limiting en endpoints públicos sensibles (creación de pedidos, búsqueda, login) para mitigar spam/bots, CSRF donde aplique (formularios con estado de sesión), secretos solo en variables de entorno server-side (nunca en el bundle del cliente ni en columnas legibles por RLS pública), logs sin datos sensibles innecesarios, y política de backups (sección 35). Adicionalmente: **el número de pedido humano (`ZOE-2026-000154`) nunca funciona como credencial de acceso** — es predecible por diseño (secuencial, ver sección 18), así que la página pública de confirmación/estado de un pedido requiere además el `public_access_token` (UUID no adivinable) generado junto al pedido; conocer o adivinar un número de pedido no debe permitir consultar los datos de otro cliente.

**No mencionado explícitamente en el brief y se recomienda incorporar:** un honeypot simple + rate limiting por IP/sesión en el endpoint de creación de pedidos para mitigar pedidos falsos/spam masivo hacia WhatsApp; 2FA obligatorio para Super Admin dado que ese rol puede cambiar precios y usuarios; política de retención y borrado de datos de clientes (derecho a solicitar eliminación de sus datos), relevante aunque Venezuela no tenga hoy una ley integral de protección de datos equivalente al GDPR — es buena práctica igualmente y prepara al negocio ante una eventual regulación.

---

## 24. Performance

Presupuesto de imágenes: formatos AVIF/WebP con fallback, tamaños responsivos generados automáticamente, lazy loading fuera del viewport inicial, `priority`/preconexión solo para el LCP real de cada página (ej. primera imagen del hero o de la ficha de producto). Carruseles de producto implementados sin librerías pesadas (CSS scroll-snap + JS mínimo) para no penalizar INP. ISR para catálogo/producto/Home con revalidación bajo demanda al publicar cambios desde el admin (no esperar al intervalo de revalidación automática). Code-splitting estricto: el bundle del admin nunca se carga en el sitio público y viceversa. Fuentes con `font-display: swap` y subsetting. Monitoreo continuo de Core Web Vitals reales (campo, no solo lab) vía datos de GA4/Vercel Analytics.

---

## 25. PWA

Se recomienda incluir PWA **ligera** en el MVP tardío o V1.1 (no bloqueante para el lanzamiento): manifest con ícono y splash screen, y un service worker mínimo orientado a **cacheo de assets estáticos y shell de la app**, no a funcionamiento offline completo (el catálogo depende de datos en vivo de stock/precio, así que el offline real no aporta valor de negocio y sí riesgo de mostrar datos obsoletos). Instalable en Android vía "Agregar a pantalla de inicio". Debe implementarse con cuidado de no interferir con SSR/ISR ni con la indexación (el service worker no debe interceptar rutas que Google necesita rastrear sin JS).

---

## 26. Integraciones

**Analítica:** GA4 y Google Tag Manager para trazabilidad general y para que el propio negocio pueda añadir tags sin depender de un despliegue; Meta Pixel (cliente) + Meta Conversion API (servidor) con `event_id` compartido para deduplicar; TikTok Pixel; Google Ads (conversión). Todos los IDs públicos configurables desde `/admin/integraciones/analytics`; todos los tokens/secretos (Meta CAPI token, etc.) viven como variables de entorno server-side, nunca visibles ni editables desde un formulario que los muestre en texto plano al recargarse (se guardan pero no se re-exponen).

**Meta Conversion API — mapeo de eventos:** `ViewContent` al ver producto, `AddToCart` al agregar, `InitiateCheckout` al entrar a `/checkout`, `Lead` cuando se registra el pedido en servidor (esto es "pedido solicitado", no venta), y **`Purchase` únicamente cuando el pedido pasa a estado Confirmado/Pagado** desde el admin — nunca en el momento de abrir WhatsApp. Esta distinción evita reportar ventas infladas a las plataformas publicitarias, lo cual dañaría la calidad de la optimización de las campañas del propio negocio a mediano plazo.

**Tasa de cambio BCV (dólar y euro):** integración de solo lectura, sin credenciales de usuario, contra un proveedor externo que republica la tasa oficial (ver diseño completo en la sección 15). Se implementa igual que cualquier otra integración externa de este documento: **desacoplada** detrás de un adaptador propio (`ExchangeRateProvider`), con timeout y reintentos configurados, y **sin capacidad de romper el flujo comercial** si falla — el catálogo sigue mostrando la última tasa válida conocida. La selección del proveedor específico (DolarApi.com, pydolarve.org, BCV API u otro) y su configuración de respaldo se confirman en una investigación técnica corta durante la Fase 0, no en esta fase de planificación, precisamente porque el BCV no ofrece una API propia y no corresponde asumir un contrato de integración no confirmado.

**WhatsApp:** en el MVP, deep-link `wa.me` (sin costo, sin aprobación de Meta, control total). La arquitectura de mensajes (plantillas con placeholders, tabla de pedidos con estado) queda lista para migrar a la **WhatsApp Business Platform (Cloud API)** en el futuro si el negocio quiere respuestas automáticas, catálogo nativo de WhatsApp o sincronización automática de estado de pedido desde las respuestas del cliente — pero no se construye esa integración ahora porque no hay un problema real que la justifique todavía (regla anti-overengineering del proyecto).

---

## 27. Estrategia de imágenes

Subida desde el admin con drag & drop, reordenamiento, marcado de imagen principal, texto ALT obligatorio por imagen. Procesamiento server-side automático: redimensionado a un set de tamaños estándar (thumbnail de card, tamaño de galería, tamaño de zoom), conversión a WebP/AVIF, compresión con calidad objetivo, y generación de un placeholder borroso (blur) para evitar saltos de layout. Ninguna imagen subida por el admin se sirve "cruda" al público — siempre pasa por el pipeline de optimización antes de quedar disponible. Las imágenes se referencian por variante para permitir que cambiar de color cambie la galería sin duplicar archivos innecesariamente.

---

## 28. Design system

**Tokens:** color (primary, secondary, accent, background, text, muted, success, warning, error), tipografía (familia, escala, pesos), spacing (escala consistente en base 4/8), radios de borde, sombras, y velocidad/curva de animación estándar. Todos editables desde `Apariencia/Branding` dentro de límites seguros (no CSS arbitrario, para proteger diseño y rendimiento, según el punto 37 del brief).

**Breakpoints explícitos:** móvil pequeño (≤360px), móvil (361–639px), tablet (640–1023px), laptop (1024–1279px), desktop grande (≥1280px), diseñados mobile-first (se construye para móvil y se expande hacia arriba, nunca al revés).

**Microinteracciones:** transiciones cortas (150–250ms) en agregar al carrito, favorito, apertura de drawers/bottom sheets, cambio de filtros e imágenes, siempre respetando `prefers-reduced-motion`.

---

## 29. Componentes UI necesarios (inventario)

Navegación: Header (desktop/mobile), menú mobile, buscador con autocomplete, breadcrumbs, footer.
Producto: ProductCard (con slider interno), ProductGallery (zoom/fullscreen/swipe), VariantSelector (color), SizeSelector (con estados), PriceDisplay (con descuento y doble moneda), QuickView (modal desktop / bottom sheet mobile), StickyAddToCart mobile.
Listados: FilterPanel/FilterDrawer, SortDropdown, Pagination/LoadMore, EmptyState, Skeletons (card, galería, texto).
Carrito/Checkout: CartDrawer o página de carrito, CartLineItem, CheckoutStepper o formulario por secciones, AddressForm condicional, DeliveryMethodSelector, PaymentMethodSelector, OrderSummary.
Feedback: Toast, Modal, BottomSheet, ConfirmDialog, ErrorState, Banner de alerta.
Formularios (admin y checkout): Input, Select, Combobox, DatePicker, FileUpload/Dropzone con reordenamiento, RichText limitado (descripción de producto), Toggle, Tabs.
Datos (admin): DataTable con filtros/orden/paginación/acciones en bloque, StatCard/KPI, Charts (línea, barra), AuditLogEntry, StatusBadge configurable por estado de pedido.
Marketing: HeroBlock, BannerBlock, ProductSliderBlock, CollectionBlock, ImageTextBlock, CTABlock — todos como bloques del page builder controlado (sección 39).

---

## 30. Routes (frontend y endpoints)

El sitemap completo de la sección 5 cubre las rutas de frontend. A nivel de endpoints/backend (Route Handlers o Server Actions), los grupos principales son:

**Públicos:** `GET /api/products` (listado con filtros), `GET /api/products/[slug]`, `GET /api/search?q=`, `GET /api/search/suggest?q=` (autocomplete), `POST /api/cart`, `PATCH /api/cart/items/[id]`, `DELETE /api/cart/items/[id]`, `POST /api/checkout/quote` (recalcular totales antes de confirmar), `POST /api/orders` (crea el pedido — el endpoint más sensible del sistema, idempotente), `POST /api/favorites`, `POST /api/analytics/events`, `GET /api/stores`.

**Admin (todos requieren sesión + rol, nunca expuestos sin autenticación):** CRUD estándar para `products`, `categories`, `brands`, `collections`, `stores`, `banners`, `home-sections`, `payment-methods`, `shipping-zones`, `users`; endpoints específicos `POST /api/admin/inventory/movements`, `POST /api/admin/inventory/transfers`, `PATCH /api/admin/orders/[id]/status`, `POST /api/admin/import` (con `GET /api/admin/import/template`), `GET /api/admin/reports/*` (KPIs agregados), `PATCH /api/admin/settings/*`, `POST /api/admin/exchange-rate`.

Ningún endpoint administrativo se expone bajo el mismo prefijo que uno público por error de diseño; la separación `/api/admin/*` vs `/api/*` es explícita y se refuerza con middleware, no solo con convención de nombres.

---

## 31. Estructura del proyecto (propuesta)

```
zoe-catalog/
  app/
    (public)/                 rutas públicas (grupo de rutas)
    admin/                    dashboard, con su propio layout y middleware
    api/                      route handlers públicos y /api/admin
  components/
    ui/                       primitivos del design system (shadcn base)
    catalog/                  ProductCard, FilterPanel, etc.
    product/                  Gallery, VariantSelector, SizeSelector...
    cart/ checkout/
    admin/                    componentes exclusivos del dashboard
    marketing/                bloques del page builder
  lib/
    domain/                   lógica de negocio pura (pricing, inventory, orders, whatsapp-message)
    db/                       cliente Postgres/Supabase, queries
    validation/                schemas compartidos (zod) frontend+backend
    auth/                     helpers de sesión/roles
    analytics/                tracking client + server (CAPI)
  supabase/
    migrations/                migraciones versionadas
    seed/                      datos demo (Zoe, 2 sucursales, categorías, productos ficticios)
  public/
  tests/
    unit/ integration/ e2e/
  scripts/                     jobs (liberar reservas, reportes nocturnos)
```

Principio guía: `lib/domain` no importa nada de Next.js ni de la capa HTTP — así la lógica de pricing/inventario/pedidos se puede testear de forma aislada y, en teoría, reutilizar si el backend evoluciona.

---

## 32. Variables de entorno necesarias (sin valores)

**Públicas (cliente):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `NEXT_PUBLIC_SITE_URL`.

**Servidor (secretos, nunca en el bundle del cliente):** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_DATASET_ID`, `GOOGLE_ADS_CONVERSION_SECRET`, `CLOUDINARY_API_SECRET` (si aplica), `CRON_SECRET` (para autenticar los jobs programados), `ADMIN_SESSION_SECRET`.

---

## 33. Testing strategy

**Unit:** reglas de pricing (descuentos, redondeo, conversión de moneda), generación de ID de pedido, construcción del mensaje de WhatsApp (placeholders/sanitización), cálculo de disponibilidad (`on_hand - reservas`).
**Integration:** checkout completo contra base de datos de prueba (creación de pedido, reserva de stock, idempotencia), importación masiva con archivos válidos/inválidos, cambio de estado de pedido y su efecto en inventario.
**E2E:** flujo Home → Producto → selección de talla → Carrito → Checkout → WhatsApp (verificando que se abre el enlace correcto y que el pedido quedó registrado), flujo admin de creación de producto, flujo de ajuste de inventario.
**Responsive:** verificación en viewport Android típico, iPhone y desktop, con atención especial a inputs y bottom sheets.
**Casos especiales a probar explícitamente:** talla se agota durante el checkout (dos pestañas simulando dos clientes), producto cambia de precio entre que se agrega al carrito y se hace checkout, WhatsApp no abre (fallback visible), conexión lenta/intermitente durante el envío del pedido, imagen que falla al cargar, doble clic en "Enviar pedido" (verificar que no duplica), formulario de checkout enviado dos veces, carrito con productos ya archivados/descontinuados, sucursal fuera de horario, moneda o tasa de cambio modificada entre el momento de ver el precio y confirmar el pedido.

---

## 34. Deployment

Entornos: **local** (desarrollo con base de datos de prueba/seed), **development** (rama de integración, deploy automático de preview por PR en Vercel), **staging** (réplica de producción para validar antes de publicar, con su propia base de datos), **production**. Migraciones de base de datos versionadas y aplicadas como parte del pipeline (nunca cambios manuales directos en producción). Variables de entorno separadas por entorno, nunca compartidas entre staging y producción. Revalidación bajo demanda (ISR) disparada automáticamente cuando el admin publica cambios de catálogo/Home/banners.

---

## 35. Backups y recuperación

Backups automáticos diarios de base de datos (con retención razonable, ej. 30 días) y backups del almacenamiento de imágenes, ambos con prueba periódica de restauración (un backup nunca probado no es un backup confiable). Point-in-time recovery si el proveedor lo soporta (Supabase lo ofrece en planes adecuados), para poder recuperar el estado justo antes de un incidente. Documentar el procedimiento de restauración para que no dependa de una sola persona.

---

## 36. Observabilidad

Logs separados de cliente (errores JS, Web Vitals reales) y servidor (errores de API, jobs programados), sin datos sensibles en texto plano (nunca teléfonos completos o tokens en logs). Monitoreo de errores (tipo Sentry o equivalente) con alertas para fallos en el flujo crítico (creación de pedidos, apertura de WhatsApp fallida repetidamente, jobs de liberación de stock que no corren). Monitoreo de uptime del sitio público y del panel admin por separado. Dashboard interno de salud básica (últimos errores, jobs recientes) accesible solo a Super Admin.

---

## 37. MVP (lista exacta)

Público: Home con hero y secciones administrables básicas, Catálogo con filtros esenciales (categoría, precio, talla, color, disponibilidad) y búsqueda, Producto completo (galería, variantes, tallas, recomendaciones simples), Carrito persistente, Checkout guest de un flujo corto, registro server-side de pedido con validación/recalculo/reserva de stock e idempotencia, apertura de WhatsApp con mensaje generado y fallback de copiar, página de Tiendas, políticas básicas, favoritos con almacenamiento local.

Admin: autenticación con roles básicos, CRUD de productos con variantes e imágenes optimizadas, categorías/marcas/colecciones, inventario por sucursal con movimientos y transferencias, gestión de pedidos con cambio de estado y notas, gestión de clientes (vista derivada de pedidos), configuración de empresa/sucursales/branding esencial, configuración de WhatsApp (número principal + enrutamiento confirmado por sucursal con respaldo automático al principal, plantilla de mensaje), configuración de monedas con **tasa BCV automática (dólar y euro) más respaldo manual** y **visualización dual USD/Bs activada por defecto**, métodos de pago y de entrega (pickup/delivery/envío) administrables, importación/exportación CSV/XLSX con plantilla, validación de errores y **motor de importación por perfiles** (con un perfil para Fina desde el MVP, sin acoplar el resto del sistema a Fina), dashboard con KPIs esenciales y gráficos básicos, analítica interna (eventos + embudo), integración de GA4/Meta Pixel/CAPI básica, SEO técnico completo (sitemap, robots, metadata, schema Product/Organization/LocalBusiness, SEO local por tienda), audit log de acciones administrativas clave.

**Explícitamente fuera del MVP:** pago en línea, cuentas de cliente con login, reseñas, cupones/2x1, PWA instalable, recuperación de carrito abandonado activa, feeds a Meta/Google/TikTok Catalog, tasa de cambio automatizada por API, permisos granulares por usuario (se queda en roles predefinidos), page builder libre (se queda en bloques controlados), multi-idioma.

---

## 38. V1.1

Historial de precios visible en admin, "avísame cuando esté disponible", recuperación de carrito abandonado opt-in vía WhatsApp, PWA instalable, bulk actions más completas en productos/inventario, reglas automáticas más ricas para secciones del Home y colecciones, notificaciones push internas al admin (nuevo pedido), plantilla de tallas configurable con más profundidad (por marca), reportes exportables (PDF/Excel) para el dueño, permisos granulares reales por usuario (ya con la tabla `role_permissions` lista desde el MVP).

## 39. V2

Reseñas y calificaciones (con fotos, aprobación, verificación de compra), cupones y promociones tipo 2x1/combos, feeds automáticos para Meta Catalog/Google Merchant/TikTok Catalog, tasa de cambio automatizada (fuente configurable), cuentas de cliente opcionales con historial de pedidos propio, QR para catálogo/producto/colección/tienda pensado para las tiendas físicas, integración con WhatsApp Business Platform (Cloud API) para respuestas/estado automatizado.

## 40. Futuro

Pago en línea (pasarela local + posible tarjeta internacional), marketplace/multi-tienda real si el negocio decide expandirse más allá de Zoe, programa de fidelidad, A/B testing formal de Home/precios/mensajes, app nativa si el volumen lo justifica, integración con sistemas de facturación fiscal si la operación lo requiere.

---

## 41. Roadmap de implementación (orden real, por dependencias)

**Fase 0 — Fundaciones.** Setup del repositorio, CI básico, entornos, modelo de datos inicial y migraciones, seed de datos demo (Zoe, 2 sucursales, categorías y productos ficticios), autenticación admin básica.

**Fase 1 — Design system.** Tokens, componentes primitivos (botones, inputs, cards, badges, modal/drawer/bottom sheet, skeletons, estados vacíos), layout público y layout admin base.

**Fase 2 — Catálogo core (admin + público en paralelo, porque uno alimenta al otro).** CRUD de productos/variantes/imágenes/categorías/marcas en admin; listado y ficha de producto en público leyendo esos mismos datos. Sin esto no hay nada que mostrar ni que comprar.

**Fase 3 — Inventario.** Modelo de stock por sucursal, movimientos, transferencias, y su reflejo en disponibilidad del producto público (selector de talla real).

**Fase 4 — Carrito y checkout.** Carrito persistente, formulario de checkout, recalculo server-side, reserva temporal con locking, generación de ID de pedido, idempotencia.

**Fase 5 — WhatsApp y pedidos.** Generación del mensaje, apertura del enlace con fallback, gestión de pedidos en admin (estados, notas, historial), conversión de reserva en salida definitiva de inventario.

**Fase 6 — Monedas y comercial.** Tasa de cambio manual, visualización dual, métodos de pago y de entrega administrables.

**Fase 7 — Marketing y Home administrable.** Bloques del Home, banners, colecciones por reglas, page builder controlado.

**Fase 8 — Búsqueda y filtros avanzados.** Autocomplete, tolerancia a errores, filtros persistentes, registro de búsquedas sin resultados.

**Fase 9 — Analítica e integraciones.** Eventos internos, embudo, dashboard ejecutivo, GA4/GTM/Meta Pixel/CAPI/TikTok.

**Fase 10 — SEO y performance.** Metadata dinámica, sitemap/robots, schema.org, SEO local por tienda, auditoría de Core Web Vitals, optimización final de imágenes/carga.

**Fase 11 — Testing integral, hardening de seguridad y QA de casos especiales**, previos al lanzamiento.

**Fase 12 — Lanzamiento y observabilidad**, con monitoreo activo la primera semana.

Este orden respeta que nada tiene sentido sin catálogo (Fase 2), que el checkout no puede validar stock sin inventario (Fase 3 antes de 4), que WhatsApp no puede generar un mensaje sin un pedido ya creado (Fase 5 después de 4), y que analítica/SEO se benefician de tener el flujo real funcionando para medir sobre datos reales en vez de mockups (Fases 9–10 al final).

---

## 42. Dependencias entre módulos

Inventario depende de Catálogo (variantes). Checkout depende de Carrito, Inventario (para reservar) y Clientes (para registrar). WhatsApp depende de Pedidos (no puede generar mensaje sin pedido creado) y de Configuración de sucursales/empresa (número a usar). Analítica depende de que existan los eventos de todo lo anterior (no se puede medir un embudo que no existe). SEO depende de Catálogo/Categorías/Tiendas para tener contenido que indexar. Dashboard ejecutivo depende de Pedidos + Analítica. Monedas afecta a Catálogo (precio base), Carrito/Checkout (recalculo) y Pedidos (snapshot de tasa). Home administrable depende de Catálogo/Colecciones/Banners para tener contenido que mostrar en los bloques.

---

## 43. Riesgos técnicos

Condiciones de carrera en inventario si el locking no se implementa correctamente (mitigado con el diseño transaccional de la sección 14). Mensajes de WhatsApp rotos por caracteres especiales mal codificados (mitigado con generación server-side y encoding estricto de URL). Crecimiento del catálogo superando lo que Postgres full-text puede manejar cómodamente (mitigado con ruta de migración a Meilisearch/Typesense ya prevista). Dependencia de un solo proveedor (Supabase) para Auth+DB+Storage — riesgo aceptado conscientemente por velocidad de desarrollo, mitigado porque el modelo de datos es Postgres estándar (portable) y las imágenes se referencian por URL (proveedor intercambiable). Revalidación de ISR mal configurada mostrando datos de catálogo desactualizados tras publicar cambios (mitigado con revalidación bajo demanda explícita desde el admin, no solo por tiempo). Reservas de stock que no se liberan si el job programado falla silenciosamente (mitigado con observabilidad/alertas específicas sobre ese job, sección 36).

## 44. Riesgos comerciales

Que el cliente abandone el checkout si se le piden demasiados datos — mitigado con el checkout mínimo de la sección 16. Que la vendedora reciba el mensaje de WhatsApp y no actualice el estado del pedido en el sistema, perdiendo la trazabilidad de "venta confirmada" — mitigado con una UX de cambio de estado tan simple como sea posible desde el móvil (sección 120) y, a futuro, con integración de WhatsApp Business Platform para automatizar parte de esa actualización. Que la tasa de cambio quede desactualizada y genere disputas — mitigado con snapshot de tasa por pedido y un recordatorio visual en el admin de "hace cuánto se actualizó la tasa". Que se prometa stock que ya no existe por una venta hecha directamente en tienda física sin registrar en el sistema — este es un riesgo operativo real y debe abordarse con disciplina de proceso (toda venta física también se descuenta en el sistema), no solo con tecnología.

## 45. Edge cases (consolidado)

Talla se agota durante el checkout; producto cambia de precio entre agregar al carrito y confirmar; WhatsApp no abre (popup bloqueado o app no instalada); conexión lenta o se pierde durante el envío del pedido; una imagen falla al cargar; el usuario duplica el pedido con doble clic o reenvío de formulario; carrito con productos que ya fueron archivados o eliminados; sucursal seleccionada está fuera de horario (no debe bloquear el pedido — ver sección 64 del brief); producto archivado que sigue en un enlace compartido en redes sociales (debe mostrar estado claro, no error 500); moneda o tasa de cambio modificada entre que el cliente ve el precio y confirma; cliente pide una combinación de talla/color que nunca existió como variante; admin intenta bajar el stock por debajo de reservas activas (debe advertir, no simplemente truncar a un número inconsistente); importación masiva con filas parcialmente inválidas (se procesan las válidas y se reporta el resto, sección 52); dos administradores editando el mismo producto simultáneamente (última escritura gana, pero se registra en audit log para poder investigar si hay conflicto real).

---

## 46. Criterios de aceptación (por módulo principal)

**Catálogo público:** un producto publicado aparece en su categoría/colección correspondiente en menos de un minuto tras publicarse (revalidación bajo demanda); los filtros combinados nunca muestran un producto sin stock en ninguna sucursal salvo que la visibilidad de stock esté configurada para mostrarlo igual; la búsqueda tolera al menos un error tipográfico simple y siempre registra la consulta.

**Producto:** no es posible seleccionar ni enviar al carrito una combinación de variante sin stock disponible; el precio mostrado siempre coincide con el que el servidor usará al crear el pedido salvo cambios ocurridos en el ínterin (en cuyo caso el checkout debe advertir explícitamente, no cobrar en silencio un precio distinto).

**Carrito/Checkout:** un carrito abandonado y recuperado en una sesión posterior conserva sus líneas; un pedido no puede crearse dos veces por reintento de red o doble clic (verificable por `idempotency_key` único); ningún pedido se crea sin que el stock haya sido validado y reservado en la misma transacción.

**WhatsApp:** todo pedido registrado genera un mensaje que contiene número de pedido, todos los productos con su variante y cantidad, subtotal/total, método de entrega, datos del cliente y método de pago preferido, sin datos truncados ni caracteres rotos; si el enlace no abre automáticamente, el usuario siempre tiene una alternativa visible para completar el envío manualmente.

**Inventario:** la disponibilidad mostrada al público nunca cuenta unidades reservadas por otro pedido activo; toda modificación de stock queda en `inventory_movements` con usuario, fecha y motivo; una transferencia entre tiendas nunca deja el stock total del sistema inconsistente (la suma antes y después de la transferencia es igual).

**Dashboard:** los KPIs del día coinciden con lo que se obtiene consultando directamente los pedidos de ese día en base de datos (sin discrepancias por caché mal invalidado); un cambio de estado de pedido queda reflejado en el historial con usuario y fecha.

---

## 47. Decisiones arquitectónicas (con alternativas consideradas)

**Postgres relacional vs. base documental:** se eligió Postgres por las garantías transaccionales que necesita el modelo de inventario por variante×sucursal con locking, y por la naturaleza intrínsecamente relacional de producto→variante→stock→pedido. Una base documental (Firestore/Mongo) habría requerido reconstruir a mano garantías que Postgres da nativamente.

**Supabase vs. backend propio:** se eligió Supabase para reducir el tiempo y el costo operativo de mantener Auth, RLS y Storage por separado, aceptando conscientemente cierto acoplamiento a un proveedor; el riesgo se mitiga porque el modelo de datos permanece en Postgres estándar y exportable.

**Reserva de stock en el pedido, no en el carrito:** evita bloquear inventario por carritos abandonados (la mayoría de los carritos, en cualquier ecommerce, no se convierten), a costa de una pequeña ventana de riesgo entre "carrito lleno" y "pedido enviado" donde otro cliente podría llevarse la última unidad — riesgo aceptado porque es el mismo que ya existe hoy en el proceso manual por WhatsApp de Zoe, y el sistema lo reduce (no lo elimina del todo, pero antes era 100% manual).

**wa.me en vez de WhatsApp Business Platform (Cloud API) desde el MVP:** la API oficial permite automatización pero requiere aprobación de Meta, costos por conversación y mayor complejidad de integración; para el volumen y madurez actual del negocio, el deep-link cumple el objetivo de negocio (mensaje completo y profesional) sin esa complejidad, y el modelo de datos queda listo para migrar cuando se justifique.

**Bloques controlados en vez de page builder libre:** un constructor tipo Elementor daría más libertad pero pondría en riesgo el rendimiento y la coherencia visual que el proyecto exige explícitamente; los bloques predefinidos y configurables logran administración sin código sin sacrificar velocidad ni diseño.

**Snapshot de producto en cada línea de pedido:** sin esto, un cambio de precio o la eliminación de un producto corrompería silenciosamente el historial de pedidos ya cerrados; se decidió duplicar los datos relevantes en `order_items` en el momento de la compra, aceptando la redundancia de datos como costo necesario para la integridad histórica.

**Tasa de cambio como adaptador, no como integración fija:** dado que el BCV no expone una API oficial confirmada, se decidió modelar la obtención de la tasa detrás de una interfaz (`ExchangeRateProvider`) con `manual` como implementación garantizada y `bcv_automatic` como implementación intercambiable entre proveedores terceros — en vez de acoplar el sistema a un endpoint específico no confirmado. La alternativa (elegir hoy un único proveedor y darlo por definitivo) se descartó porque violaría la regla del proyecto de no asumir contratos de API no confirmados, y porque un servicio de terceros gratuito puede cambiar sus condiciones o caerse sin aviso — el adaptador permite sustituirlo sin tocar el resto del sistema.

**Motor de importación genérico con perfiles, en vez de un importador acoplado a Fina:** se decidió que el `ImportEngine` no conozca a Fina en absoluto — solo entiende "perfiles de mapeo" — y que Fina sea simplemente el primer perfil configurado. La alternativa (construir el importador directamente pensando en el formato de Fina) habría sido más rápida hoy, pero ataría el núcleo del sistema a un software externo del que Zoe podría dejar de depender, contradiciendo la regla permanente de no depender de Fina como software.

**Separación total para una futura "Blank Catalog":** aunque hoy Zoe Catalog es una implementación de un solo negocio (Zoe) y no se construye ninguna infraestructura multi-tenant (regla anti-SaaS-prematuro ya explicada en la sección 6 del brief original), sí se decidió mantener disciplina de nombres y componentes (sección 5: genérico vs. específico de Zoe) precisamente para que, si más adelante se crea una versión genérica del producto para otro cliente, esa sea una **base de datos, almacenamiento y despliegue completamente separados** — nunca un sistema multi-tenant compartiendo datos entre Zoe y un futuro cliente. Es una decisión de disciplina de código hoy, no de infraestructura hoy.

---

## 48. Preguntas o decisiones pendientes (requieren decisión humana)

1. **Teléfono vs. WhatsApp como un solo campo en checkout:** se recomienda un solo campo con opción de aclarar si difiere, pero es una decisión de UX/negocio final que conviene validar con clientas reales (¿alguna vez compran usando el WhatsApp de otra persona, por ejemplo un familiar?).
2. **Ventana exacta de la reserva temporal de stock:** se recomiendan 15–30 minutos; el valor final depende de cuán rápido responde típicamente el equipo de ventas por WhatsApp en la operación real de Zoe.
3. **Visibilidad de stock (sección 17):** se recomienda "urgencia" para ≤3 unidades y "disponible" en otro caso, pero es una decisión de estrategia comercial (¿Zoe quiere comunicar escasez o prefiere no presionar al cliente?).
4. **Proveedor concreto de la tasa BCV automática:** ya está decidido _que_ se integra (dólar y euro, con respaldo manual — sección 15); lo que falta es elegir, en una investigación técnica corta de Fase 0, _cuál_ de los servicios candidatos (DolarApi.com, pydolarve.org, BCV API u otro) se usa como principal y cuál como respaldo, en función de uptime y límites de uso reales al momento de implementar.
5. **Alcance real de "envío nacional" para el lanzamiento:** si Zoe ya trabaja hoy con alguna empresa de envío específica y bajo qué condiciones de costo, para configurarla como dato desde el primer día en vez de dejarla vacía.

_(Ya no aparecen aquí como pendientes el enrutamiento de WhatsApp por sucursal ni el modo de visualización de moneda: ambos quedaron decididos en esta actualización. Deliberadamente tampoco se pregunta nada que ya tenga una buena práctica razonable aplicable — como estructura de tablas, formato de IDs o estrategia de idempotencia — porque esas decisiones ya están resueltas en este documento.)_

---

## 49. Mejoras que no estaban mencionadas en el brief original

- **Protección anti-spam/bots en la creación de pedidos:** honeypot y rate limiting por sesión/IP, para que alguien no pueda saturar el WhatsApp del negocio generando pedidos falsos de forma automatizada.
- **2FA para roles administrativos sensibles** (Super Admin/Administrador), dado que pueden modificar precios, usuarios y configuración financiera.
- **Página/landing individual por sucursal con SEO local completo**, ya incorporada al sitemap (sección 5) aunque el brief solo la insinuaba en el punto 67 — se explicita como requisito de primera clase por su impacto directo en tráfico orgánico local ("zapatería cerca de mí").
- **Guía de tallas por marca**, no solo genérica — algunas marcas de calzado tallan distinto entre sí, y eso genera devoluciones/quejas si no se comunica.
- **Impresión/vista simplificada del pedido para el personal de tienda física**, útil al momento de preparar el par antes de que el cliente llegue a retirar.
- **Solicitud de transferencia entre sucursales sugerida automáticamente** cuando un producto no tiene stock en la sucursal elegida pero sí en otra — convierte un "no hay" en una oportunidad de venta con un paso extra operativo.
- **Historial de precios (sección 129 del brief) implementado desde el MVP como tabla, aunque su UI de consulta se libere en V1.1** — es mucho más barato capturarlo desde el principio que reconstruirlo retroactivamente.
- **Política de retención/borrado de datos de clientes**, para poder atender una eventual solicitud de "elimina mis datos" sin tener que diseñarlo de emergencia después.
- **Alertas de observabilidad específicas sobre el job de liberación de reservas de stock**, porque si ese job falla silenciosamente, el catálogo empezaría a mostrar "agotado" en productos que en realidad sí tienen stock disponible — un bug invisible pero con impacto directo en ventas.
- **Consistencia NAP (nombre/dirección/teléfono) entre el sitio y Google Business Profile** como requisito explícito de SEO local, no solo "tener la página".

---

## 50. Plan final recomendado

Construir Zoe Catalog en el orden de dependencias de la sección 41, empezando por un modelo de datos sólido (sección 12) porque casi todo lo demás se apoya en él, seguido del design system para no reconstruir componentes a mitad de camino. Priorizar primero que el catálogo público y el admin de productos nazcan juntos (uno sin el otro no sirve), después inventario (porque el checkout no puede validar nada sin él), después carrito/checkout con todas sus garantías de servidor (recalculo, idempotencia, reserva con locking), y solo entonces WhatsApp — que es, en última instancia, la culminación de todo lo anterior, no el punto de partida técnico aunque sea el corazón conceptual del producto.

En paralelo a la construcción del flujo principal, mantener siempre activas las prácticas transversales que no son "una fase" sino una disciplina continua: TypeScript estricto, sin datos de negocio hardcodeados, validación en frontend y backend, RLS activo desde la primera tabla sensible, y ningún atajo de seguridad "temporal" sin documentarlo explícitamente si en algún momento se usa uno.

Lanzar con el MVP de la sección 37 — deliberadamente sin pago en línea, sin cuentas de cliente, sin reseñas — porque el valor central del negocio (mostrar el producto perfecto, encontrarlo rápido, verificar stock real, y entregar un pedido limpio a WhatsApp) no depende de ninguna de esas piezas, y añadirlas antes de validar el flujo principal sería sobreconstruir. Medir desde el día uno con el embudo interno (sección 21) para que las decisiones de V1.1/V2 se tomen con datos reales de comportamiento de las clientas de Zoe, no con suposiciones.

Este documento queda como referencia viva: cuando la implementación revele que una decisión aquí tomada no encaja con la realidad del negocio, el criterio para ajustarla sigue siendo el mismo que rige todo el proyecto — conversión, facilidad de uso, velocidad, administración sin código, WhatsApp, inventario correcto, analítica confiable y una escalabilidad razonable, nunca prematura.

---

_Fin del documento de planificación. No se ha escrito código de implementación — esta fase queda cerrada a la espera de aprobación y de las decisiones pendientes de la sección 48 antes de iniciar la Fase 0 del roadmap._
