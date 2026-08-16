/**
 * Tipos compartidos entre `lib/domain/catalog.ts` (server-only, hace
 * queries) y componentes cliente (ej. el selector de variante). Este
 * archivo NO importa `server-only` ni Supabase a propósito — solo formas
 * de datos, para poder importarse desde un Client Component sin arrastrar
 * código de servidor al bundle del navegador.
 */

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  isNew: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  badgeCustom: string | null;
  primaryImageUrl: string | null;
  minPriceUsd: number | null;
  maxCompareAtPriceUsd: number | null;
}

export interface ProductDetailOptionValue {
  id: string;
  value: string;
  extra: Record<string, unknown>;
}

export interface ProductDetailOption {
  id: string;
  name: string;
  values: ProductDetailOptionValue[];
}

export interface ProductDetailVariant {
  id: string;
  sku: string;
  priceUsd: number;
  compareAtPriceUsd: number | null;
  status: "active" | "inactive";
  optionValueIds: string[];
  images: { url: string; altText: string }[];
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  descriptionShort: string | null;
  description: string | null;
  material: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; altText: string; order: number; isPrimary: boolean }[];
  options: ProductDetailOption[];
  variants: ProductDetailVariant[];
}
