-- Allow duplicate SKUs across products and variants.
-- SKU now identifies a model/style, not a unique database record.
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_sku_key;

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_sku_key;
