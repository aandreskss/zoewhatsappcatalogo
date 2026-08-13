import { z } from "zod";

/**
 * Schema del checkout (sección 16/24/25/26/27 del plan). Se usa tanto en
 * el formulario del cliente (UX) como, obligatoriamente, en el Route
 * Handler que crea el pedido — el frontend nunca es la única validación.
 */

// Teléfono único (regla confirmada en el plan: un solo campo con prefijo,
// no duplicar teléfono/WhatsApp) — se normaliza a solo dígitos + prefijo
// antes de guardar.
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Teléfono inválido")
  .transform((value) => value.replace(/[^\d+]/g, ""))
  .refine((value) => /^\+?\d{7,15}$/.test(value), "Teléfono inválido");

export const checkoutCustomerSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  lastName: z.string().trim().max(80).optional(),
  phone: phoneSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const checkoutDeliverySchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("pickup"),
    storeId: z.string().uuid("Selecciona una sucursal"),
  }),
  z.object({
    method: z.literal("delivery"),
    shippingZoneId: z.string().uuid("Selecciona una zona de delivery"),
    state: z.string().trim().min(1),
    city: z.string().trim().min(1),
    address: z.string().trim().min(5, "La dirección es muy corta"),
    reference: z.string().trim().max(300).optional(),
  }),
  z.object({
    method: z.literal("shipping"),
    state: z.string().trim().min(1),
    city: z.string().trim().min(1),
    address: z.string().trim().min(5, "La dirección es muy corta"),
    reference: z.string().trim().max(300).optional(),
  }),
]);

export const createOrderSchema = z.object({
  customer: checkoutCustomerSchema,
  delivery: checkoutDeliverySchema,
  paymentMethodId: z.string().uuid("Selecciona un método de pago"),
  paymentNotes: z.string().trim().max(300).optional(),
  idempotencyKey: z.string().uuid(),
  source: z
    .object({
      utmSource: z.string().trim().max(120).optional(),
      utmMedium: z.string().trim().max(120).optional(),
      utmCampaign: z.string().trim().max(120).optional(),
      utmContent: z.string().trim().max(120).optional(),
      utmTerm: z.string().trim().max(120).optional(),
      fbclid: z.string().trim().max(300).optional(),
      gclid: z.string().trim().max(300).optional(),
      ttclid: z.string().trim().max(300).optional(),
      referrer: z.string().trim().max(300).optional(),
    })
    .partial()
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
