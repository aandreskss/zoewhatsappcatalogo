"use client";

import * as React from "react";

declare global {
  interface Window {
    SyncLead?: {
      capture:  (d: Record<string, string>) => Promise<unknown>;
      purchase: (d: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export function VipLeadForm() {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/vip-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Algo salió mal. Intenta de nuevo.");
        setStatus("error");
      } else {
        setStatus("success");
        void window.SyncLead?.capture({
          name,
          phone,
          email: email || "",
          source: "vip_form",
        });
      }
    } catch {
      setErrorMsg("Error de conexión. Intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p style={{ fontWeight: 700, fontSize: 18, color: "#7B1847", margin: 0 }}>
          ¡Ya estás en la lista VIP! 🎉
        </p>
        <p style={{ fontSize: 14, color: "#29252A", opacity: 0.7, margin: 0, maxWidth: 280 }}>
          Te avisaremos por WhatsApp de todas las ofertas y descuentos exclusivos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#29252A", opacity: 0.7 }}>
          Nombre *
        </label>
        <input
          type="text"
          required
          placeholder="¿Cómo te llamas?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid #EBE0E7",
            fontSize: 14,
            color: "#29252A",
            backgroundColor: "white",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#29252A", opacity: 0.7 }}>
          WhatsApp / Teléfono *
        </label>
        <input
          type="tel"
          required
          placeholder="0424-0000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid #EBE0E7",
            fontSize: 14,
            color: "#29252A",
            backgroundColor: "white",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#29252A", opacity: 0.7 }}>
          Email <span style={{ opacity: 0.5 }}>(opcional)</span>
        </label>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid #EBE0E7",
            fontSize: 14,
            color: "#29252A",
            backgroundColor: "white",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      {errorMsg && (
        <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          marginTop: 4,
          padding: "13px",
          backgroundColor: status === "loading" ? "#A0325E" : "#7B1847",
          color: "white",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 15,
          border: "none",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "background-color 150ms",
          width: "100%",
        }}
      >
        {status === "loading" ? "Registrando…" : "¡Unirme a la lista VIP! 🌟"}
      </button>

      <p style={{ fontSize: 11, color: "#29252A", opacity: 0.45, margin: 0, textAlign: "center" }}>
        Sin spam. Solo ofertas reales de Zoe Shop.
      </p>
    </form>
  );
}
