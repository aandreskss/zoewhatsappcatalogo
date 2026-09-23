"use client";

import * as React from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";

export function CartDrawer() {
  const { items, isOpen, closeCart, itemCount, subtotalUsd } = useCart();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: "rgba(41, 37, 42, 0.55)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 280ms ease",
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FDF8FB",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms ease-out",
          boxShadow: "-4px 0 32px rgba(41,37,42,0.14)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            backgroundColor: "#7B1847",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
              Tu carrito{itemCount > 0 ? ` (${itemCount})` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              backgroundColor: "rgba(255,255,255,0.2)",
              cursor: "pointer",
              color: "white",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CTA Banner */}
        <div
          style={{
            backgroundColor: "#F0D8E8",
            borderBottom: "1px solid #F0B8D0",
            padding: "14px 20px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>🛍️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#7B1847", margin: 0, marginBottom: 3, lineHeight: 1.3 }}>
              ¡Llena tus datos de contacto y termina tu compra en WhatsApp!
            </p>
            <p style={{ fontSize: 13, color: "#7B1847", margin: 0, opacity: 0.85 }}>
              💬 Pregunta por tu descuento especial
            </p>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                color: "#29252A",
                opacity: 0.4,
              }}
            >
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Tu carrito está vacío</p>
              <p style={{ fontSize: 13, margin: 0 }}>Agrega productos para continuar</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: 12,
                    border: "1px solid #EBE0E7",
                  }}
                >
                  {/* Imagen */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#F0D8E8",
                    }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", backgroundColor: "#F0D8E8" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#29252A",
                        margin: 0,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.productName}
                    </p>
                    <p style={{ fontSize: 12, color: "#29252A", opacity: 0.55, margin: 0, marginBottom: 6 }}>
                      {item.variantLabel}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#7B1847" }}>
                        ${(item.currentPriceUsd * item.quantity).toFixed(2)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#29252A",
                          opacity: 0.5,
                          backgroundColor: "#F0D8E8",
                          borderRadius: 6,
                          padding: "2px 8px",
                        }}
                      >
                        ×{item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #EBE0E7",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flexShrink: 0,
              backgroundColor: "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#29252A", opacity: 0.65 }}>Subtotal</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#29252A" }}>
                ${subtotalUsd.toFixed(2)} USD
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px",
                backgroundColor: "#7B1847",
                color: "white",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Llenar mis datos y pedir por WhatsApp 💬
            </Link>

            <button
              type="button"
              onClick={closeCart}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px",
                backgroundColor: "transparent",
                color: "#29252A",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 13,
                border: "1px solid #EBE0E7",
                cursor: "pointer",
                opacity: 0.7,
              }}
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
