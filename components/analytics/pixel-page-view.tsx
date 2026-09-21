"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * Dispara fbq('track', 'PageView') en cada cambio de ruta.
 * Se salta el primer render porque el snippet de inicialización del pixel
 * ya dispara PageView al cargar; este componente solo cubre las
 * navegaciones SPA posteriores (Next.js no re-ejecuta el script).
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
