"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: string;
  message: string;
  variant: "default" | "success" | "error";
}

type ToastFn = (message: string, variant?: ToastItem["variant"]) => void;

const ToastContext = React.createContext<ToastFn | null>(null);

/**
 * Toast (sección 28/29 del plan) — feedback breve no bloqueante para
 * acciones de admin/checkout (ej. "Guardado", "No se pudo copiar el
 * mensaje"). Se auto-descarta a los 4s; el usuario también puede
 * cerrarlo a mano. Un solo `<ToastProvider>` en el layout raíz sirve
 * tanto al sitio público como al admin.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback<ToastFn>((message, variant = "default") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{ boxShadow: "var(--shadow-md)" }}
            className={cn(
              "animate-fade-in pointer-events-auto max-w-sm rounded-[var(--radius-md)] px-4 py-2.5 text-sm",
              toast.variant === "default" &&
                "bg-[var(--color-foreground)] text-[var(--color-background)]",
              toast.variant === "success" &&
                "bg-[var(--color-success)] text-[var(--color-primary-foreground)]",
              toast.variant === "error" &&
                "bg-[var(--color-error)] text-[var(--color-primary-foreground)]",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
