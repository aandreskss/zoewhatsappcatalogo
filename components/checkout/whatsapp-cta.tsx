"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Botón principal de WhatsApp + fallback SIEMPRE visible (sección 17/83
 * del plan): si el popup se bloquea o WhatsApp no está instalado, el
 * cliente puede copiar el mensaje y el número en vez de quedar
 * atascado. No se intenta "detectar" el fallo de apertura (poco
 * confiable) — se muestra el respaldo desde el principio.
 */
export function WhatsAppCta({
  whatsappLink,
  message,
  phone,
}: {
  whatsappLink: string;
  message: string;
  phone: string;
}) {
  const [copied, setCopied] = React.useState<"message" | "phone" | null>(null);

  async function copy(text: string, which: "message" | "phone") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button asChild size="lg" className="w-full">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          Enviar pedido por WhatsApp
        </a>
      </Button>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        ¿No se abrió WhatsApp? Copia el pedido y envíalo manualmente.
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => void copy(message, "message")}
        >
          {copied === "message" ? "¡Copiado!" : "Copiar pedido"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => void copy(phone, "phone")}
        >
          {copied === "phone" ? "¡Copiado!" : "Copiar número"}
        </Button>
      </div>
    </div>
  );
}
