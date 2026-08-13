import { z } from "zod";

/**
 * Schemas compartidos frontend/backend (regla permanente: "utilizar
 * schemas compartidos cuando sea razonable"). El frontend los usa para dar
 * feedback inmediato; el Route Handler/Server Action SIEMPRE vuelve a
 * validar con el mismo schema — nunca confía en que el cliente ya validó.
 */

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El slug es obligatorio")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

export const brandSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  slug: slugSchema,
  logoUrl: z.string().url().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal("")),
  active: z.boolean().default(true),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

const GENDERS = ["mujer", "hombre", "unisex", "nino", "nina"] as const;
const PRODUCT_STATUSES = ["draft", "published", "hidden", "archived"] as const;

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  slug: slugSchema,
  sku: z.string().trim().max(60).nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  gender: z.enum(GENDERS).nullable().optional(),
  descriptionShort: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  material: z.string().trim().max(200).nullable().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(160).nullable().optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  sku: z.string().trim().min(1, "El SKU es obligatorio").max(60),
  color: z.string().trim().min(1, "El color es obligatorio").max(60),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido")
    .nullable()
    .optional(),
  size: z.string().trim().min(1, "La talla es obligatoria").max(20),
  priceUsd: z.coerce.number().min(0, "El precio no puede ser negativo"),
  compareAtPriceUsd: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type VariantInput = z.infer<typeof variantSchema>;
