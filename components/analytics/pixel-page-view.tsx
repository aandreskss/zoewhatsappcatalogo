"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * Dispara fbq('track', 'PageView') en cada navegación SPA.
 * El primer PageView lo maneja el onLoad de fbevents.js en ThirdPartyScripts,
 * garantizando que dispara solo cuando el script realmente está listo.
 */
export function PixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
