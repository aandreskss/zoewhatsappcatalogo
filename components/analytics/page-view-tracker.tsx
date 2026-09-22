"use client";

import * as React from "react";
import { useAnalytics } from "@/components/analytics/analytics-provider";

/** Dispara `page_view` al montar la página. Componente separado para no forzar a toda la página a ser cliente solo por esto. */
export function PageViewTracker({ page }: { page: string }) {
  const track = useAnalytics();

  React.useEffect(() => {
    track("page_view", { metadata: { page } });
  }, [track, page]);

  return null;
}
