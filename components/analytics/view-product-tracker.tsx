"use client";

import * as React from "react";
import { useAnalytics } from "@/components/analytics/analytics-provider";

/** Dispara `view_product` al montar la ficha de producto (sección 21 del plan). Componente separado para no forzar a toda la página de producto a ser cliente solo por esto. */
export function ViewProductTracker({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const track = useAnalytics();

  React.useEffect(() => {
    track("view_product", {
      entityType: "product",
      entityId: productId,
      metadata: { productName },
    });
  }, [track, productId, productName]);

  return null;
}
