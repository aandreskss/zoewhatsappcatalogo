"use client";

import * as React from "react";

export interface ClientCartItem {
  id: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  variantLabel: string;
  currentPriceUsd: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface CartState {
  items: ClientCartItem[];
  isLoading: boolean;
  itemCount: number;
  subtotalUsd: number;
  refresh: () => Promise<void>;
  addItem: (
    variantId: string,
    quantity?: number,
  ) => Promise<{ ok: boolean; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const CartContext = React.createContext<CartState | null>(null);

async function fetchCart(): Promise<ClientCartItem[]> {
  const res = await fetch("/api/cart", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: ClientCartItem[] };
  return data.items;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ClientCartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await fetchCart());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // No se reutiliza `refresh` aquí (aunque hace lo mismo): esa función marca
  // `isLoading` de forma síncrona antes de cualquier `await`, lo cual el
  // linter de react-hooks marca como "setState síncrono dentro de un
  // efecto". En el montaje inicial `isLoading` ya arranca en `true`, así
  // que solo hace falta actualizar estado dentro de los callbacks
  // asíncronos (`.then`/`.finally`), nunca de forma síncrona en el cuerpo
  // del efecto.
  React.useEffect(() => {
    let cancelled = false;
    fetchCart()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = React.useCallback(async (variantId: string, quantity = 1) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    const data = (await res.json()) as { items?: ClientCartItem[]; error?: string };
    if (!res.ok)
      return { ok: false, error: data.error ?? "No se pudo agregar al carrito" };
    setItems(data.items ?? []);
    return { ok: true };
  }, []);

  const updateQuantity = React.useCallback(async (itemId: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      const data = (await res.json()) as { items: ClientCartItem[] };
      setItems(data.items);
    }
  }, []);

  const removeItem = React.useCallback(async (itemId: string) => {
    const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      const data = (await res.json()) as { items: ClientCartItem[] };
      setItems(data.items);
    }
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalUsd = items.reduce(
    (sum, item) => sum + item.currentPriceUsd * item.quantity,
    0,
  );

  const value: CartState = {
    items,
    isLoading,
    itemCount,
    subtotalUsd,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
