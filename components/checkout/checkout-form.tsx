"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/cart/cart-context";
import { formatUsd } from "@/lib/domain/pricing";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    SyncLead?: {
      capture:  (d: Record<string, string>) => Promise<unknown>
      purchase: (d: Record<string, unknown>) => Promise<unknown>
    }
  }
}

const IDEMPOTENCY_KEY_STORAGE = "zoe_checkout_idempotency_key";

function getOrCreateIdempotencyKey(): string {
  const existing = sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, created);
  return created;
}

type DeliveryMethod = "pickup" | "delivery" | "shipping";

export function CheckoutForm({
  stores,
  shippingZones,
  paymentMethods,
}: {
  stores: { id: string; name: string; address: string | null }[];
  shippingZones: { id: string; name: string; cost_usd: number }[];
  paymentMethods: { id: string; name: string; instructions: string | null }[];
}) {
  const router = useRouter();
  const { items, subtotalUsd, refresh } = useCart();

  const [deliveryMethod, setDeliveryMethod] = React.useState<DeliveryMethod>("pickup");
  const [selectedZoneId, setSelectedZoneId] = React.useState("");
  const [selectedMethodId, setSelectedMethodId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId) ?? null;
  const deliveryCost = deliveryMethod === "delivery" && selectedZone ? selectedZone.cost_usd : 0;
  const totalUsd = subtotalUsd + deliveryCost;
  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) ?? null;

  function changeDeliveryMethod(method: DeliveryMethod) {
    setDeliveryMethod(method);
    if (method !== "delivery") setSelectedZoneId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    window.fbq?.("track", "InitiateCheckout", {
      value: totalUsd,
      currency: "USD",
      num_items: items.length,
    });

    const formData = new FormData(event.currentTarget);
    const idempotencyKey = getOrCreateIdempotencyKey();

    const delivery =
      deliveryMethod === "pickup"
        ? { method: "pickup" as const, storeId: String(formData.get("storeId")) }
        : deliveryMethod === "delivery"
          ? {
              method: "delivery" as const,
              shippingZoneId: String(formData.get("shippingZoneId")),
              state: "Carabobo",
              city: "Valencia",
              address: String(formData.get("address")),
              reference: String(formData.get("reference") || ""),
            }
          : {
              method: "shipping" as const,
              state: String(formData.get("state")),
              city: String(formData.get("city")),
              address: String(formData.get("address")),
              reference: String(formData.get("reference") || ""),
            };

    const payload = {
      customer: {
        firstName: String(formData.get("firstName")),
        lastName: String(formData.get("lastName") || ""),
        phone: String(formData.get("phone")),
        email: String(formData.get("email") || ""),
      },
      delivery,
      paymentMethodId: String(formData.get("paymentMethodId")),
      paymentNotes: String(formData.get("paymentNotes") || ""),
      idempotencyKey,
      website: String(formData.get("website") || ""),
    };

    let res: Response;
    let data: { orderNumber?: string; publicAccessToken?: string; whatsappLink?: string; error?: string };
    try {
      res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = (await res.json()) as typeof data;
    } catch {
      setIsSubmitting(false);
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
      return;
    }

    if (!res.ok || !data.orderNumber || !data.publicAccessToken || !data.whatsappLink) {
      setIsSubmitting(false);
      setError(data.error ?? "No se pudo registrar el pedido. Intenta de nuevo.");
      return;
    }

    sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE);

    void window.SyncLead?.capture({
      name:  `${payload.customer.firstName} ${payload.customer.lastName}`.trim(),
      email: payload.customer.email ?? "",
      phone: payload.customer.phone,
    });

    await refresh();

    const confirmUrl = `/checkout/confirmacion?order=${encodeURIComponent(data.orderNumber)}&token=${encodeURIComponent(data.publicAccessToken)}`;
    router.push(confirmUrl);
  }

  if (items.length === 0) {
    return <p className="text-[var(--color-muted-foreground)]">Tu carrito está vacío.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Honeypot antispam */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">No completar este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Datos del cliente */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase">
          Tus datos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="firstName">Nombre</Label>
            <Input id="firstName" name="firstName" required disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="lastName">Apellido (opcional)</Label>
            <Input id="lastName" name="lastName" disabled={isSubmitting} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="phone">WhatsApp / teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+58 412 1234567"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input id="email" name="email" type="email" disabled={isSubmitting} />
        </div>
      </section>

      {/* Entrega */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase">
          Entrega
        </h2>
        <div className="flex gap-2">
          {(
            [
              ["pickup", "Retiro en tienda"],
              ["delivery", "Delivery"],
              ["shipping", "Envío nacional"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeDeliveryMethod(value)}
              className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${
                deliveryMethod === value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {deliveryMethod === "pickup" ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="storeId">Sucursal</Label>
            <select
              id="storeId"
              name="storeId"
              required
              disabled={isSubmitting}
              className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
            >
              <option value="">Selecciona una sucursal</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.address ? `— ${store.address}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : deliveryMethod === "delivery" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="shippingZoneId">Zona de delivery</Label>
              <select
                id="shippingZoneId"
                name="shippingZoneId"
                required
                disabled={isSubmitting}
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="">Selecciona tu zona</option>
                {shippingZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {formatUsd(zone.cost_usd)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" required disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reference">Punto de referencia (opcional)</Label>
              <Input id="reference" name="reference" disabled={isSubmitting} />
            </div>
          </div>
        ) : (
          /* Envío nacional — pide estado y ciudad */
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" name="state" required disabled={isSubmitting} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" required disabled={isSubmitting} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" required disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reference">Punto de referencia (opcional)</Label>
              <Input id="reference" name="reference" disabled={isSubmitting} />
            </div>
          </div>
        )}
      </section>

      {/* Pago */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase">
          Pago preferido
        </h2>
        <div className="flex flex-col gap-1">
          <Label htmlFor="paymentMethodId">Método</Label>
          <select
            id="paymentMethodId"
            name="paymentMethodId"
            required
            disabled={isSubmitting}
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            <option value="">Selecciona un método</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMethod?.instructions && (
          <div className="rounded-[var(--radius-md)] border border-[#F0B8D0] bg-[#FDF0F6] px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#7B1847]">
              Instrucciones de pago
            </p>
            <p className="whitespace-pre-line text-sm text-[#29252A]">
              {selectedMethod.instructions}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="paymentNotes">Notas para el pago (opcional)</Label>
          <Input id="paymentNotes" name="paymentNotes" disabled={isSubmitting} />
        </div>
      </section>

      {/* Resumen de totales */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-sm">
        <div className="flex items-center justify-between text-[var(--color-muted-foreground)]">
          <span>Subtotal productos</span>
          <span>{formatUsd(subtotalUsd)}</span>
        </div>
        {deliveryMethod === "delivery" && selectedZone && (
          <div className="flex items-center justify-between text-[var(--color-muted-foreground)]">
            <span>Delivery — {selectedZone.name}</span>
            <span>{formatUsd(selectedZone.cost_usd)}</span>
          </div>
        )}
        {deliveryMethod === "delivery" && !selectedZone && (
          <div className="flex items-center justify-between text-[var(--color-muted-foreground)]">
            <span>Delivery</span>
            <span className="italic">selecciona zona</span>
          </div>
        )}
        <div className="flex items-center justify-between font-semibold">
          <span>Total estimado</span>
          <span className="text-lg">{formatUsd(totalUsd)}</span>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar pedido por WhatsApp"}
      </Button>
    </form>
  );
}
