import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";
import {
  fileToRows,
  normalizeHeader,
  slugify,
  findCategoryId,
} from "@/lib/domain/fina-nativo-helpers";

// ── Public types ─────────────────────────────────────────────────────────────

export interface ImportProductResult {
  name: string;
  sku: string;
  status: "created" | "exists" | "error";
  variantsCreated?: number;
  message?: string;
}

export interface ImportProductsResponse {
  total: number;
  created: number;
  exists: number;
  errors: number;
  results: ImportProductResult[];
}

// ── Internal types ────────────────────────────────────────────────────────────

interface VariationRow {
  size: string;
  costo: number | null;
}

interface ItemGroup {
  itemNombre: string;
  itemSku: string;
  itemCategoria: string;
  variations: VariationRow[];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  let rows: string[][];
  try {
    rows = await fileToRows(file);
  } catch (e) {
    return NextResponse.json(
      { error: `Error leyendo el archivo: ${e instanceof Error ? e.message : "formato no soportado"}` },
      { status: 400 },
    );
  }

  if (rows.length < 2)
    return NextResponse.json({ error: "El archivo está vacío o solo tiene encabezados" }, { status: 400 });

  const rawHeaders = rows[0]!;
  const normHeaders = rawHeaders.map(normalizeHeader);

  // ── Auto-detect column indices ──────────────────────────────────────────────
  const tipoIdx = normHeaders.indexOf("tipo");
  const nombreIdx = normHeaders.indexOf("nombre");
  const skuIdx = normHeaders.indexOf("sku");
  const categoriaIdx = normHeaders.indexOf("categoria");
  const costoIdx = normHeaders.indexOf("costounitario");

  if (tipoIdx === -1 || nombreIdx === -1) {
    return NextResponse.json(
      {
        error: `No es un inventario de Fina válido. Se esperan columnas "Tipo" y "Nombre". Detectadas: ${rawHeaders.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // ── Parse rows into ItemGroups ──────────────────────────────────────────────
  const groups: ItemGroup[] = [];
  let currentGroup: ItemGroup | null = null;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i]!;
    const tipo = (cols[tipoIdx] ?? "").toLowerCase().trim();
    const nombre = (cols[nombreIdx] ?? "").trim();

    if (tipo === "item") {
      currentGroup = {
        itemNombre: nombre,
        itemSku: skuIdx !== -1 ? (cols[skuIdx] ?? "").trim() : "",
        itemCategoria: categoriaIdx !== -1 ? (cols[categoriaIdx] ?? "").trim() : "",
        variations: [],
      };
      groups.push(currentGroup);
    } else if (tipo === "variacion" && currentGroup) {
      const costoRaw = costoIdx !== -1 ? parseFloat(cols[costoIdx] ?? "") : NaN;
      currentGroup.variations.push({
        size: nombre,
        costo: isNaN(costoRaw) ? null : costoRaw,
      });
    }
  }

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const service = createSupabaseServiceRoleClient();
  const { data: allCategories } = await service
    .from("categories")
    .select("id, name")
    .eq("active", true);
  const categories = allCategories ?? [];

  // ── Process each group ──────────────────────────────────────────────────────
  const results: ImportProductResult[] = [];

  for (const group of groups) {
    const parentSku = group.itemSku.trim().toUpperCase();
    const productName = group.itemNombre.trim();
    if (!productName) continue;

    // Skip groups with no variations
    if (group.variations.length === 0) continue;

    const hasSku = parentSku.length > 0;

    try {
      // ── Check if product already exists ──────────────────────────────────
      let existingProductId: string | null = null;

      if (hasSku) {
        // No filtered by deleted_at: the SKU unique constraint applies to ALL rows
        const { data: ep } = await service
          .from("products")
          .select("id")
          .ilike("sku", parentSku)
          .maybeSingle();
        if (ep) existingProductId = ep.id;
      }

      if (!existingProductId) {
        const { data: ep } = await service
          .from("products")
          .select("id")
          .ilike("name", productName)
          .is("deleted_at", null)
          .maybeSingle();
        if (ep) existingProductId = ep.id;
      }

      if (existingProductId) {
        results.push({ name: productName, sku: parentSku, status: "exists" });
        continue;
      }

      // ── Create product ────────────────────────────────────────────────────
      const baseSlug = slugify(productName);
      let slug = baseSlug;
      const { data: slugCheck } = await service
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (slugCheck) slug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;

      const { data: newProduct, error: prodErr } = await service
        .from("products")
        .insert({
          name: productName,
          slug,
          sku: group.itemSku || null,
          category_id: findCategoryId(group.itemCategoria, categories),
          status: "draft",
        })
        .select("id")
        .single();
      if (prodErr || !newProduct) throw new Error(prodErr?.message ?? "Error creando producto");

      const productId = newProduct.id;

      // ── Create option "Talla" ──────────────────────────────────────────
      const { data: newOpt, error: optErr } = await service
        .from("product_options")
        .insert({ product_id: productId, name: "Talla", order: 1 })
        .select("id")
        .single();
      if (optErr || !newOpt) throw new Error(optErr?.message ?? "Error creando opción Talla");

      const optionId = newOpt.id;

      // ── Create variations ──────────────────────────────────────────────
      let variantsCreated = 0;

      for (let vi = 0; vi < group.variations.length; vi++) {
        const variation = group.variations[vi]!;
        const { size, costo } = variation;
        if (!size) continue;

        const { data: newOptVal, error: ovErr } = await service
          .from("product_option_values")
          .insert({ option_id: optionId, value: size, order: vi + 1 })
          .select("id")
          .single();
        if (ovErr || !newOptVal) throw new Error(ovErr?.message ?? "Error creando talla");

        const variantSku = hasSku
          ? `${parentSku}-${size}`
          : `${productName.toUpperCase()}-${size}`;

        const { data: newVariant, error: varErr } = await service
          .from("product_variants")
          .insert({
            product_id: productId,
            sku: variantSku,
            price_usd: 0,
            cost_usd: costo,
            status: "active",
          })
          .select("id")
          .single();
        if (varErr || !newVariant) throw new Error(varErr?.message ?? "Error creando variante");

        await service.from("variant_option_values").insert({
          variant_id: newVariant.id,
          option_value_id: newOptVal.id,
        });

        variantsCreated++;
      }

      results.push({ name: productName, sku: parentSku, status: "created", variantsCreated });
    } catch (e) {
      results.push({
        name: productName,
        sku: parentSku,
        status: "error",
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  const createdCount = results.filter((r) => r.status === "created").length;
  if (createdCount > 0) {
    revalidatePath("/admin/productos");
  }

  return NextResponse.json({
    total: results.length,
    created: createdCount,
    exists: results.filter((r) => r.status === "exists").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  } satisfies ImportProductsResponse);
}
