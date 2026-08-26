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

// ── Public types ──────────────────────────────────────────────────────────────

export interface ImportCustomResult {
  name: string;
  sku: string;
  status: "created" | "exists" | "error";
  variantsCreated: number;
  inventorySet: number;
  message?: string;
}

export interface ImportCustomResponse {
  total: number;
  created: number;
  exists: number;
  errors: number;
  variantsCreated: number;
  inventorySet: number;
  results: ImportCustomResult[];
}

// ── Column aliases ────────────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, string> = {
  nombre: "nombre", name: "nombre", producto: "nombre",
  sku: "sku", codigo: "sku",
  categoria: "categoria", category: "categoria",
  talla: "talla", size: "talla", talle: "talla",
  precioventa: "precioventa", precio: "precioventa", price: "precioventa",
  preciocosto: "preciocosto", costo: "preciocosto", cost: "preciocosto",
  costounitario: "preciocosto",
};

// ── Internal types ────────────────────────────────────────────────────────────

interface VRow {
  talla: string;
  precioVenta: number | null;
  precioCosto: number | null;
  storeCounts: Map<string, number>;
}

interface PGroup {
  nombre: string;
  sku: string;
  categoria: string;
  variants: VRow[];
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

  const service = createSupabaseServiceRoleClient();

  const { data: allStores } = await service.from("stores").select("id, name, code").eq("active", true);
  const stores = allStores ?? [];

  const { data: allCategories } = await service.from("categories").select("id, name").eq("active", true);
  const categories = allCategories ?? [];

  // ── Detect columns ────────────────────────────────────────────────────────

  const rawHeaders = rows[0]!;
  const normHeaders = rawHeaders.map(normalizeHeader);

  const colIdx: Partial<Record<string, number>> = {};
  const storeColMap = new Map<string, number>(); // storeId → column index

  for (let i = 0; i < normHeaders.length; i++) {
    const norm = normHeaders[i]!;
    const field = FIELD_ALIASES[norm];
    if (field) {
      if (colIdx[field] === undefined) colIdx[field] = i;
    } else {
      const store = stores.find(
        (s) =>
          (s.code && normalizeHeader(s.code) === norm) ||
          normalizeHeader(s.name) === norm,
      );
      if (store) storeColMap.set(store.id, i);
    }
  }

  if (colIdx["nombre"] === undefined || colIdx["talla"] === undefined) {
    return NextResponse.json(
      {
        error: `Columnas requeridas "nombre" y "talla" no encontradas. Detectadas: ${rawHeaders.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // ── Parse rows into product groups ────────────────────────────────────────

  const groups = new Map<string, PGroup>();

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i]!;
    const nombre = (cols[colIdx["nombre"]!] ?? "").trim();
    const sku =
      colIdx["sku"] !== undefined
        ? (cols[colIdx["sku"]] ?? "").trim().toUpperCase()
        : "";
    const categoria =
      colIdx["categoria"] !== undefined
        ? (cols[colIdx["categoria"]] ?? "").trim()
        : "";
    const talla =
      colIdx["talla"] !== undefined
        ? (cols[colIdx["talla"]] ?? "").trim()
        : "";
    const precioVentaRaw =
      colIdx["precioventa"] !== undefined
        ? parseFloat(cols[colIdx["precioventa"]] ?? "")
        : NaN;
    const precioCostoRaw =
      colIdx["preciocosto"] !== undefined
        ? parseFloat(cols[colIdx["preciocosto"]] ?? "")
        : NaN;

    if (!nombre || !talla) continue;

    const key = `${nombre}||${sku}`;
    if (!groups.has(key)) groups.set(key, { nombre, sku, categoria, variants: [] });

    const storeCounts = new Map<string, number>();
    for (const [storeId, ci] of storeColMap.entries()) {
      const qty = parseInt(cols[ci] ?? "0", 10);
      if (!isNaN(qty) && qty >= 0) storeCounts.set(storeId, qty);
    }

    groups.get(key)!.variants.push({
      talla,
      precioVenta: isNaN(precioVentaRaw) ? null : precioVentaRaw,
      precioCosto: isNaN(precioCostoRaw) ? null : precioCostoRaw,
      storeCounts,
    });
  }

  // ── Process each product group ────────────────────────────────────────────

  const results: ImportCustomResult[] = [];

  for (const group of groups.values()) {
    const { nombre, sku, categoria, variants } = group;
    if (!variants.length) continue;

    try {
      // Check if product already exists
      let existingId: string | null = null;

      if (sku) {
        const { data: eps } = await service
          .from("products")
          .select("id")
          .ilike("sku", sku)
          .is("deleted_at", null)
          .limit(1);
        existingId = eps?.[0]?.id ?? null;
      }

      if (!existingId) {
        const { data: eps } = await service
          .from("products")
          .select("id")
          .ilike("name", nombre)
          .is("deleted_at", null)
          .limit(1);
        existingId = eps?.[0]?.id ?? null;
      }

      if (existingId) {
        results.push({ name: nombre, sku, status: "exists", variantsCreated: 0, inventorySet: 0 });
        continue;
      }

      // Create product
      const baseSlug = slugify(nombre);
      let slug = baseSlug;
      const { data: sc } = await service.from("products").select("id").eq("slug", slug).maybeSingle();
      if (sc) slug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;

      const { data: prod, error: prodErr } = await service
        .from("products")
        .insert({
          name: nombre,
          slug,
          sku: sku || null,
          category_id: findCategoryId(categoria, categories),
          status: "draft",
        })
        .select("id")
        .single();
      if (prodErr || !prod) throw new Error(prodErr?.message ?? "Error creando producto");

      // Create option "Talla"
      const { data: opt, error: optErr } = await service
        .from("product_options")
        .insert({ product_id: prod.id, name: "Talla", order: 1 })
        .select("id")
        .single();
      if (optErr || !opt) throw new Error(optErr?.message ?? "Error creando opción Talla");

      let variantsCreated = 0;
      let inventorySet = 0;

      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi]!;

        // Create option value
        const { data: ov, error: ovErr } = await service
          .from("product_option_values")
          .insert({ option_id: opt.id, value: v.talla, order: vi + 1 })
          .select("id")
          .single();
        if (ovErr || !ov) throw new Error(ovErr?.message ?? "Error creando talla");

        // Create variant
        const varSku = sku ? `${sku}-${v.talla}` : `${nombre.toUpperCase()}-${v.talla}`;
        const { data: vari, error: varErr } = await service
          .from("product_variants")
          .insert({
            product_id: prod.id,
            sku: varSku,
            price_usd: v.precioVenta ?? 0,
            cost_usd: v.precioCosto,
            status: "active",
          })
          .select("id")
          .single();
        if (varErr || !vari) throw new Error(varErr?.message ?? "Error creando variante");

        await service.from("variant_option_values").insert({
          variant_id: vari.id,
          option_value_id: ov.id,
        });

        variantsCreated++;

        // Set inventory per store
        for (const [storeId, qty] of v.storeCounts.entries()) {
          const { error: invErr } = await service.from("inventory").insert({
            variant_id: vari.id,
            store_id: storeId,
            quantity_on_hand: qty,
          });

          if (!invErr) {
            if (qty > 0) {
              await service.from("inventory_movements").insert({
                variant_id: vari.id,
                store_id: storeId,
                type: "entrada",
                quantity_delta: qty,
                reason: "Importación masiva CSV personalizado",
                previous_quantity: 0,
                new_quantity: qty,
                user_id: user.id,
              });
            }
            inventorySet++;
          }
        }
      }

      results.push({ name: nombre, sku, status: "created", variantsCreated, inventorySet });
    } catch (e) {
      results.push({
        name: nombre,
        sku,
        status: "error",
        variantsCreated: 0,
        inventorySet: 0,
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  const createdCount = results.filter((r) => r.status === "created").length;
  if (createdCount > 0) {
    revalidatePath("/admin/productos");
    revalidatePath("/admin/inventario");
  }

  return NextResponse.json({
    total: results.length,
    created: createdCount,
    exists: results.filter((r) => r.status === "exists").length,
    errors: results.filter((r) => r.status === "error").length,
    variantsCreated: results.reduce((s, r) => s + r.variantsCreated, 0),
    inventorySet: results.reduce((s, r) => s + r.inventorySet, 0),
    results,
  } satisfies ImportCustomResponse);
}
