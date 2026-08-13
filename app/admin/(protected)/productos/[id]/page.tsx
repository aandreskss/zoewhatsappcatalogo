import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { StatusSelect } from "@/components/admin/status-select";
import { AddVariantForm } from "@/components/admin/add-variant-form";
import { AddImageForm } from "@/components/admin/add-image-form";
import { InventoryCell } from "@/components/admin/inventory-cell";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, sku, status")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const [{ data: images }, { data: variants }, { data: stores }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, url, alt_text, order")
      .eq("product_id", id)
      .order("order"),
    supabase
      .from("product_variants")
      .select("id, sku, price_usd, compare_at_price_usd, status")
      .eq("product_id", id),
    supabase.from("stores").select("id, name").eq("active", true).order("name"),
  ]);

  const variantIds = (variants ?? []).map((v) => v.id);

  const [{ data: optionLinks }, { data: inventoryRows }] =
    variantIds.length > 0
      ? await Promise.all([
          supabase
            .from("variant_option_values")
            .select("variant_id, product_option_values(value)")
            .in("variant_id", variantIds),
          supabase
            .from("inventory")
            .select("variant_id, store_id, quantity_on_hand")
            .in("variant_id", variantIds),
        ])
      : [{ data: [] }, { data: [] }];

  const labelsByVariant = new Map<string, string[]>();
  for (const link of optionLinks ?? []) {
    const value = link.product_option_values?.value;
    if (!value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(value);
    labelsByVariant.set(link.variant_id, list);
  }

  const inventoryByKey = new Map<string, number>();
  for (const row of inventoryRows ?? []) {
    inventoryByKey.set(`${row.variant_id}:${row.store_id}`, row.quantity_on_hand);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            /producto/{product.slug}
          </p>
        </div>
        <StatusSelect productId={product.id} status={product.status} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Imágenes</h2>
        <div className="flex flex-wrap gap-3">
          {(images ?? []).map((image) => (
            <div
              key={image.id}
              className="relative size-24 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]"
            >
              <Image src={image.url} alt={image.alt_text} fill className="object-cover" />
            </div>
          ))}
        </div>
        <AddImageForm productId={product.id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Variantes e inventario</h2>
        {(variants ?? []).length > 0 ? (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-muted)] text-left">
                <tr>
                  <th className="p-3">Variante</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Precio</th>
                  {(stores ?? []).map((store) => (
                    <th key={store.id} className="p-3">
                      {store.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(variants ?? []).map((variant) => (
                  <tr key={variant.id} className="border-t border-[var(--color-border)]">
                    <td className="p-3">
                      {(labelsByVariant.get(variant.id) ?? []).join(" / ") || "—"}
                    </td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">
                      {variant.sku}
                    </td>
                    <td className="p-3">${variant.price_usd.toFixed(2)}</td>
                    {(stores ?? []).map((store) => (
                      <td key={store.id} className="p-3">
                        <InventoryCell
                          variantId={variant.id}
                          storeId={store.id}
                          productId={product.id}
                          initialQuantity={
                            inventoryByKey.get(`${variant.id}:${store.id}`) ?? 0
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay variantes. Agrega la primera (color + talla + precio).
          </p>
        )}
        <AddVariantForm productId={product.id} />
      </section>
    </div>
  );
}
