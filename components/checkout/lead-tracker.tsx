"use client";

import { useEffect } from "react";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function LeadTracker({ orderNumber, totalUsd }: { orderNumber: string; totalUsd: number }) {
  useEffect(() => {
    window.fbq?.("track", "Lead", {
      value: totalUsd,
      currency: "USD",
      order_id: orderNumber,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
