-- Zoe Catalog — 0004: catálogo (marcas, categorías, colecciones, productos,
-- opciones y variantes). Ver sección 12/13 del plan para el razonamiento
-- completo del modelo Product → Option → Variant.

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  website text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  banner_url text,
  parent_id uuid references categories (id) on delete set null,
  seo_title text,
  seo_description text,
  "order" integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create index idx_categories_parent on categories (parent_id);

create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  type text not null default 'manual' check (type in ('manual', 'rule_based')),
  rule jsonb, -- ej. {"category_id": "...", "max_price_usd": 50}
  seo_title text,
  seo_description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_collections_updated_at
  before update on collections
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text unique,
  brand_id uuid references brands (id) on delete set null,
  category_id uuid references categories (id) on delete set null,
  gender text check (gender in ('mujer', 'hombre', 'unisex', 'nino', 'nina')),
  description_short text,
  description text,
  material text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'archived')),
  badge_custom text,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- soft delete (regla permanente: no borrar productos con historial)
);

create trigger set_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create index idx_products_status_category on products (status, category_id) where deleted_at is null;
create index idx_products_brand on products (brand_id) where deleted_at is null;
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_products_tags on products using gin (tags);

create table collection_products (
  collection_id uuid not null references collections (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  "order" integer not null default 0,
  primary key (collection_id, product_id)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text not null default '',
  "order" integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_product_images_product on product_images (product_id);

-- Opciones genéricas (Color, Talla, y cualquier opción futura) en vez de
-- columnas fijas — sección 13 del plan.
create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null, -- 'Color', 'Talla', ...
  "order" integer not null default 0
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options (id) on delete cascade,
  value text not null, -- 'Negro', '38', ...
  extra jsonb not null default '{}'::jsonb, -- ej. {"hex": "#000000"} para color
  "order" integer not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  price_usd numeric(10, 2) not null check (price_usd >= 0),
  compare_at_price_usd numeric(10, 2) check (compare_at_price_usd is null or compare_at_price_usd >= 0),
  cost_usd numeric(10, 2),
  status text not null default 'active' check (status in ('active', 'inactive')),
  barcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_product_variants_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

create index idx_product_variants_product on product_variants (product_id);

create table variant_option_values (
  variant_id uuid not null references product_variants (id) on delete cascade,
  option_value_id uuid not null references product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table variant_images (
  variant_id uuid not null references product_variants (id) on delete cascade,
  image_id uuid not null references product_images (id) on delete cascade,
  primary key (variant_id, image_id)
);

create table size_charts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories (id) on delete set null,
  brand_id uuid references brands (id) on delete set null,
  gender text,
  rows jsonb not null default '[]'::jsonb, -- [{eu: 38, us: 7.5, uk: 5, cm: 24}]
  created_at timestamptz not null default now()
);

-- Slug no es identificador interno (regla permanente): cuando cambia,
-- se registra aquí para servir un 301 (sección 22 del plan).
create table redirects (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'product' | 'category' | 'collection'
  entity_id uuid not null,
  old_slug text not null,
  new_slug text not null,
  created_at timestamptz not null default now()
);

create index idx_redirects_lookup on redirects (entity_type, old_slug);
