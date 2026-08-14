import { describe, it, expect } from "vitest";
import { renderWhatsAppTemplate, buildWhatsAppLink } from "@/lib/domain/whatsapp-shared";

const BASE_DATA = {
  orderNumber: "ZOE-2026-000154",
  customerName: "Ana Pérez",
  items: [
    {
      productName: "Zapato Deportivo",
      variantLabel: "Negro / 38",
      quantity: 1,
      unitPriceUsd: 25,
    },
  ],
  subtotalLabel: "$25.00",
  totalLabel: "$25.00",
  deliveryMethodLabel: "Retiro en tienda",
  storeLabel: "Zoe Centro",
  paymentMethodLabel: "Pago móvil",
};

describe("renderWhatsAppTemplate", () => {
  it("sustituye todos los placeholders declarados", () => {
    const template =
      "Pedido {{order_number}} de {{customer_name}}\n{{items}}\nSubtotal: {{subtotal}}\nTotal: {{total}}\nEntrega: {{delivery_method}}\nTienda: {{store}}\nPago: {{payment_method}}";
    const message = renderWhatsAppTemplate(template, BASE_DATA);

    expect(message).toContain("Pedido ZOE-2026-000154 de Ana Pérez");
    expect(message).toContain("Zapato Deportivo");
    expect(message).toContain("Negro / 38");
    expect(message).toContain("Subtotal: $25.00");
    expect(message).toContain("Entrega: Retiro en tienda");
    expect(message).toContain("Tienda: Zoe Centro");
    expect(message).toContain("Pago: Pago móvil");
  });

  it("sanitiza saltos de línea/tabs en datos del pedido para no romper el formato", () => {
    const message = renderWhatsAppTemplate("Cliente: {{customer_name}}", {
      ...BASE_DATA,
      customerName: "Ana\nPérez\tGómez\r\nHacker",
    });
    // \r y \n se reemplazan cada uno por su propio espacio (por eso el
    // doble espacio antes de "Hacker", donde había "\r\n") — lo que
    // importa es que no sobreviva ningún caracter de control, no la
    // cantidad exacta de espacios.
    expect(message).toBe("Cliente: Ana Pérez Gómez  Hacker");
    expect(message).not.toContain("\n");
    expect(message).not.toContain("\t");
    expect(message).not.toContain("\r");
  });

  it("no sustituye placeholders desconocidos ni permite que el admin inyecte uno nuevo desde el texto libre", () => {
    const message = renderWhatsAppTemplate(
      "{{order_number}} {{unknown_placeholder}}",
      BASE_DATA,
    );
    expect(message).toBe("ZOE-2026-000154 {{unknown_placeholder}}");
  });

  it("reemplaza TODAS las ocurrencias repetidas del mismo placeholder", () => {
    const message = renderWhatsAppTemplate(
      "{{order_number}} / {{order_number}}",
      BASE_DATA,
    );
    expect(message).toBe("ZOE-2026-000154 / ZOE-2026-000154");
  });
});

describe("buildWhatsAppLink", () => {
  it("genera un enlace wa.me con solo dígitos y el mensaje codificado", () => {
    const link = buildWhatsAppLink("+58 412-000-0001", "Hola, ¿cómo va todo?");
    expect(link).toBe(
      "https://wa.me/584120000001?text=Hola%2C%20%C2%BFc%C3%B3mo%20va%20todo%3F",
    );
  });

  it("nunca deja caracteres no numéricos en el número (símbolos de formato, espacios, etc.)", () => {
    const link = buildWhatsAppLink("(0412) 000-0001", "hola");
    expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  });
});
