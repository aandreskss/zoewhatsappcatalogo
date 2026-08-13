"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/cart/cart-context";
import { formatUsd } from "@/lib/domain/pricing";

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const idempotencyKey = getOrCreateIdempotencyKey();

    const delivery =
      deliveryMethod === "pickup"
        ? { method: "pickup" as const, storeId: String(formData.get("storeId")) }
        : deliveryMethod === "delivery"
          ? {
              method: "delivery" as const,
              shippingZoneId: String(formData.get("shippingZoneId")),
              state: String(formData.get("state")),
              city: String(formData.get("city")),
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
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      orderNumber?: string;
      publicAccessToken?: string;
      whatsappLink?: string;
      error?: string;
    };

    if (!res.ok || !data.orderNumber || !data.publicAccessToken || !data.whatsappLink) {
      setIsSubmitting(false);
      setError(data.error ?? "No se pudo registrar el pedido. Intenta de nuevo.");
      return;
    }

    sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE);
    await refresh();

    const confirmUrl = `/checkout/confirmacion?order=${encodeURIComponent(data.orderNumber)}&token=${encodeURIComponent(data.publicAccessToken)}`;
    router.push(confirmUrl);
  }

  if (items.length === 0) {
    return <p className="text-[var(--color-muted-foreground)]">Tu carrito está vacío.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
              onClick={() => setDeliveryMethod(value)}
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
        ) : (
          <div className="flex flex-col gap-3">
            {deliveryMethod === "delivery" ? (
              <div className="flex flex-col gap-1">
                <Label htmlFor="shippingZoneId">Zona de delivery</Label>
                <select
                  id="shippingZoneId"
                  name="shippingZoneId"
                  required
                  disabled={isSubmitting}
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
            ) : null}
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
        <div className="flex flex-col gap-1">
          <Label htmlFor="paymentNotes">Notas para el pago (opcional)</Label>
          <Input id="paymentNotes" name="paymentNotes" disabled={isSubmitting} />
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-sm">
        <span className="text-[var(--color-muted-foreground)]">Subtotal estimado</span>
        <span className="text-lg font-semibold">{formatUsd(subtotalUsd)}</span>
      </div>

      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar pedido por WhatsApp"}
      </Button>
    </form>
  );
}
