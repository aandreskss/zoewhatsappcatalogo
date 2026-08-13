"use client";

import * as React from "react";
import { setInventoryAction } from "@/app/admin/(protected)/productos/actions";
import { Input } from "@/components/ui/input";

export function InventoryCell({
  variantId,
  storeId,
  productId,
  initialQuantity,
}: {
  variantId: string;
  storeId: string;
  productId: string;
  initialQuantity: number;
}) {
  const [value, setValue] = React.useState(initialQuantity);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleBlur() {
    if (value === initialQuantity) return;
    setIsSaving(true);
    try {
      await setInventoryAction(variantId, storeId, value, productId);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Input
      type="number"
      min={0}
      value={value}
      disabled={isSaving}
      onChange={(event) => setValue(Number(event.target.value))}
      onBlur={handleBlur}
      className="h-9 w-20"
    />
  );
}
