import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { StatusSelect } from "@/components/admin/status-select";
import { AddVariantForm } from "@/components/admin/add-variant-form";
import { AddImageForm } from "@/components/admin/add-image-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { DeleteImageButton } from "@/components/admin/delete-image-button";
import { EditVariantRow } from "@/components/admin/edit-variant-row";
import { EditProductInfoForm } from "@/components/admin/edit-product-info-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, sku, status, brand_id, category_id, gender, description_short, description, material, is_new, seo_title, seo_description")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const [{ data: images }, { data: variants }, { data: stores }, { data: brands }, { data: categories }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, url, alt_text, order")
      .eq("product_id", id)
      .order("order"),
    supabase
      .from("product_variants")
      .select("id, sku, barcode, price_usd, compare_at_price_usd, cost_usd, status, variant_images(image_id, product_images(id, url))")
      .eq("product_id", id),
    supabase.from("stores").select("id, name").eq("active", true).order("name"),
    supabase.from("brands").select("id, name").eq("active", true).order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const variantIds = (variants ?? []).map((v) => v.id);

  const [{ data: optionLinks }, { data: inventoryRows }] =
    variantIds.length > 0
      ? await Promise.all([
          supabase
            .from("variant_option_values")
            .select("variant_id, product_option_values(id, value)")
            .in("variant_id", variantIds),
          supabase
            .from("inventory")
            .select("variant_id, store_id, quantity_on_hand")
            .in("variant_id", variantIds),
        ])
      : [{ data: [] }, { data: [] }];

  const labelsByVariant = new Map<string, { optionValueId: string; value: string }[]>();
  for (const link of optionLinks ?? []) {
    const ov = link.product_option_values;
    if (!ov || !ov.value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push({ optionValueId: ov.id, value: ov.value });
    labelsByVariant.set(link.variant_id, list);
  }

  const inventoryByKey = new Map<string, number>();
  for (const row of inventoryRows ?? []) {
    inventoryByKey.set(`${row.variant_id}:${row.store_id}`, row.quantity_on_hand);
  }

  // Build variant images map
  const variantImagesMap = new Map<string, { id: string; url: string }[]>();
  for (const variant of variants ?? []) {
    const imgs: { id: string; url: string }[] = [];
    for (const vi of variant.variant_images ?? []) {
      const img = vi.product_images;
      if (img && img.id && img.url) {
        imgs.push({ id: img.id, url: img.url });
      }
    }
    if (imgs.length > 0) {
      variantImagesMap.set(variant.id, imgs);
    }
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
        <div className="flex items-center gap-3">
          <DeleteProductButton productId={product.id} productName={product.name} />
          <StatusSelect productId={product.id} status={product.status} />
        </div>
      </div>

      <section className="rounded-2xl border border-[#EBE4E1] bg-white p-5 shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
        <h2 className="mb-4 text-base font-semibold text-[#29252A]">Información general</h2>
        <EditProductInfoForm
          productId={product.id}
          product={{
            name: product.name,
            sku: product.sku,
            brand_id: product.brand_id,
            category_id: product.category_id,
            gender: product.gender,
            description_short: product.description_short,
            description: product.description,
            material: product.material,
            is_new: product.is_new,
            seo_title: product.seo_title,
            seo_description: product.seo_description,
          }}
          brands={brands ?? []}
          categories={categories ?? []}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Imágenes</h2>
        <div className="flex flex-wrap gap-3">
          {(images ?? []).map((image) => (
            <div
              key={image.id}
              className="group relative size-24 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]"
            >
              <Image src={image.url} alt={image.alt_text} fill className="object-cover" />
              <DeleteImageButton imageId={image.id} productId={product.id} />
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
                  <th className="p-3">Costo</th>
                  <th className="p-3">Código</th>
                  {(stores ?? []).map((store) => (
                    <th key={store.id} className="p-3">
                      {store.name}
                    </th>
                  ))}
                  <th className="p-3">Fotos</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {(variants ?? []).map((variant) => {
                  const inventoryByStore: Record<string, number> = {};
                  for (const store of stores ?? []) {
                    const qty = inventoryByKey.get(`${variant.id}:${store.id}`);
                    if (qty !== undefined) {
                      inventoryByStore[store.id] = qty;
                    }
                  }
                  return (
                    <EditVariantRow
                      key={variant.id}
                      variant={{
                        id: variant.id,
                        sku: variant.sku,
                        barcode: variant.barcode ?? null,
                        priceUsd: variant.price_usd,
                        compareAtPriceUsd: variant.compare_at_price_usd,
                        costUsd: variant.cost_usd ?? null,
                        status: variant.status,
                      }}
                      labels={labelsByVariant.get(variant.id) ?? []}
                      variantImages={variantImagesMap.get(variant.id) ?? []}
                      stores={stores ?? []}
                      inventoryByStore={inventoryByStore}
                      productId={product.id}
                    />
                  );
                })}
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
