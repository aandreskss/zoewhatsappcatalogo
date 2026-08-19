import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { InventoryTable, type VariantRow } from "@/components/admin/inventory-table";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: stores }, { data: products }] = await Promise.all([
    supabase.from("stores").select("id, name, code").eq("active", true).order("name"),
    supabase
      .from("products")
      .select("id, name, status, product_variants(id, sku, barcode, price_usd, cost_usd, status)")
      .not("status", "eq", "archived")
      .is("deleted_at", null)
      .order("name"),
  ]);

  const allVariantIds = (products ?? []).flatMap((p) =>
    (p.product_variants ?? []).map((v) => v.id),
  );

  const [{ data: optionLinks }, { data: inventoryRows }] =
    allVariantIds.length > 0
      ? await Promise.all([
          supabase
            .from("variant_option_values")
            .select("variant_id, product_option_values(value)")
            .in("variant_id", allVariantIds),
          supabase
            .from("inventory")
            .select("variant_id, store_id, quantity_on_hand")
            .in("variant_id", allVariantIds),
        ])
      : [{ data: [] }, { data: [] }];

  // Build label map
  const labelsByVariant = new Map<string, string[]>();
  for (const link of optionLinks ?? []) {
    const value = link.product_option_values?.value;
    if (!value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(value);
    labelsByVariant.set(link.variant_id, list);
  }

  // Build stock map keyed by "variantId:storeId"
  const stockMap = new Map<string, number>();
  for (const row of inventoryRows ?? []) {
    stockMap.set(`${row.variant_id}:${row.store_id}`, row.quantity_on_hand);
  }

  const activeStores = stores ?? [];

  // Build flat variant rows
  const rows: VariantRow[] = [];
  for (const product of products ?? []) {
    for (const variant of product.product_variants ?? []) {
      const stockByStore: Record<string, number> = {};
      for (const store of activeStores) {
        stockByStore[store.id] = stockMap.get(`${variant.id}:${store.id}`) ?? 0;
      }
      const totalStock = Object.values(stockByStore).reduce((s, n) => s + n, 0);

      rows.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: (labelsByVariant.get(variant.id) ?? []).join(" / ") || "—",
        sku: variant.sku,
        barcode: variant.barcode ?? null,
        priceUsd: variant.price_usd,
        costUsd: variant.cost_usd ?? null,
        stockByStore,
        totalStock,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[#29252A]">Inventario</h1>
        <p className="mt-0.5 text-sm text-[#29252A]/50">
          {rows.length} variante{rows.length !== 1 ? "s" : ""} ·{" "}
          {activeStores.length} sucursal{activeStores.length !== 1 ? "es" : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#EBE4E1] bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EFEc]">
            <Layers size={20} className="text-[#29252A]/25" />
          </div>
          <p className="text-sm font-semibold text-[#29252A]">Sin variantes de producto</p>
          <p className="text-xs text-[#29252A]/45">
            Agrega productos con variantes para ver el inventario aquí.
          </p>
        </div>
      ) : (
        <InventoryTable rows={rows} stores={activeStores} />
      )}
    </div>
  );
}
