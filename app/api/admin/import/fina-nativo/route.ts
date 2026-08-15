import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";

// ── Public types ────────────────────────────────────────────────────────────────

export interface FinaNativoStoreResult {
  storeName: string;
  previousQty: number;
  newQty: number;
}

export interface FinaNativoRowResult {
  item: string;
  size: string;
  candidateSku: string;
  /** how the variant/product was found: by sku or by name */
  matchedBy?: "sku" | "name";
  status: "updated" | "created" | "not_found" | "skipped" | "error";
  message?: string;
  storeResults?: FinaNativoStoreResult[];
}

export interface FinaNativoImportResponse {
  total: number;
  updated: number;
  created: number;
  notFound: number;
  skipped: number;
  errors: number;
  /** Columns that were recognized as stores: "sede il duomo → Sede Il Duomo" */
  detectedStores: string[];
  /** Columns that look like stores but have no match in the DB — suggest creating */
  unknownStoreColumns: string[];
  results: FinaNativoRowResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(h: string): string {
  return normalizeForMatch(h).replace(/\s+/g, "");
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

async function fileToRows(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm") || name.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]!];
    if (!ws) return [];
    const raw: (string | number | boolean | null | undefined)[][] =
      XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    return raw.map((row) => row.map((cell) => String(cell ?? "").trim()));
  }
  const text = await file.text();
  return text.split(/\r?\n/).filter((l) => l.trim()).map(parseCsvLine);
}

/**
 * Columns in the Fina export that are NEVER store columns.
 * Normalized (no spaces, no accents, lowercase).
 */
const KNOWN_NON_STORE_KEYS = new Set([
  "tipo",
  "nombre",
  "sku",
  "categoria",
  "costounitario",
  "unidad",
  "cantidad",       // total across all stores — used as fallback
  "sinubicacion",   // explicitly ignored per spec
  "cualquiera",     // explicitly ignored per spec
]);

function isKnownNonStore(normKey: string): boolean {
  if (KNOWN_NON_STORE_KEYS.has(normKey)) return true;
  // "Valor en inventario" variants → price column, not a store
  if (normKey.startsWith("valoren") || normKey.startsWith("valorin")) return true;
  return false;
}

/**
 * Returns true if a store's name contains at least one significant word (>3 chars)
 * from the CSV column label.  Works even when names vary slightly between exports.
 */
function storeMatchesColumn(storeName: string, colLabel: string): boolean {
  const storeNorm = normalizeForMatch(storeName);
  const colNorm = normalizeForMatch(colLabel);
  const words = colNorm.split(" ").filter((w) => w.length > 3);
  if (words.length === 0) return false;
  return words.some((w) => storeNorm.includes(w));
}

function findCategoryId(
  finaCategoria: string,
  categories: Array<{ id: string; name: string }>,
): string | null {
  const norm = normalizeForMatch(finaCategoria);
  if (!norm) return null;
  const match = categories.find((c) => {
    const cn = normalizeForMatch(c.name);
    return cn === norm || cn.includes(norm) || norm.includes(cn);
  });
  return match?.id ?? null;
}

// ── Internal types ──────────────────────────────────────────────────────────────

interface StoreColMapping {
  colIdx: number;
  colLabel: string;
  storeId: string;
  storeName: string;
}

interface VariationRow {
  size: string;
  /** cost_usd from "Costo unitario" */
  costo: number | null;
  /** price_usd derived from "Valor en inventario" / "Cantidad" */
  price: number | null;
  storeCantidades: { storeId: string; storeName: string; cantidad: number }[];
}

interface ItemGroup {
  itemNombre: string;
  itemSku: string;
  itemCategoria: string;
  variations: VariationRow[];
}

// ── Route handler ───────────────────────────────────────────────────────────────

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

  const createMissing = formData.get("create_missing") === "true";
  const fallbackStoreId = (formData.get("fallback_store_id") as string | null)?.trim() || null;

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

  const tipoIdx = normHeaders.indexOf("tipo");
  const nombreIdx = normHeaders.indexOf("nombre");
  if (tipoIdx === -1 || nombreIdx === -1) {
    return NextResponse.json(
      { error: `No es un inventario de Fina válido. Se esperan columnas "Tipo" y "Nombre". Detectadas: ${rawHeaders.join(", ")}` },
      { status: 400 },
    );
  }

  const skuIdx = normHeaders.indexOf("sku");
  const costoIdx = normHeaders.indexOf("costounitario");
  const categoriaIdx = normHeaders.indexOf("categoria");
  const cantidadIdx = normHeaders.indexOf("cantidad");
  // "Valor en inventario" → public selling price (unit price = valor / cantidad)
  const valorIdx = normHeaders.findIndex(
    (h) => h.startsWith("valoren") || h.startsWith("valorin"),
  );

  const service = createSupabaseServiceRoleClient();

  const [{ data: allStores }, { data: allCategories }] = await Promise.all([
    service.from("stores").select("id, name, code").eq("active", true),
    service.from("categories").select("id, name").eq("active", true),
  ]);
  const stores = allStores ?? [];
  const categories = allCategories ?? [];

  // ── Classify columns: known data | matched store | unknown potential store ──
  const storeMappings: StoreColMapping[] = [];
  const unknownStoreColumns: string[] = [];

  for (let i = 0; i < rawHeaders.length; i++) {
    const normKey = normHeaders[i]!;
    if (isKnownNonStore(normKey)) continue;

    const matched = stores.find((s) => storeMatchesColumn(s.name, rawHeaders[i]!));
    if (matched) {
      // Avoid duplicate store mappings (same store mapped from two similar columns)
      if (!storeMappings.some((m) => m.storeId === matched.id)) {
        storeMappings.push({
          colIdx: i,
          colLabel: rawHeaders[i]!,
          storeId: matched.id,
          storeName: matched.name,
        });
      }
    } else {
      // Unknown column — might be a new store
      unknownStoreColumns.push(rawHeaders[i]!);
    }
  }

  // Fallback: if no store columns were detected, use the total "Cantidad" for one store
  if (storeMappings.length === 0 && fallbackStoreId && cantidadIdx !== -1) {
    const fallbackStore = stores.find((s) => s.id === fallbackStoreId);
    if (fallbackStore) {
      storeMappings.push({
        colIdx: cantidadIdx,
        colLabel: "Cantidad (total)",
        storeId: fallbackStore.id,
        storeName: fallbackStore.name,
      });
    }
  }

  // ── Parse rows into Item + Variation groups ─────────────────────────────────
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
      const valorRaw = valorIdx !== -1 ? parseFloat(cols[valorIdx] ?? "") : NaN;
      const cantRaw = cantidadIdx !== -1 ? parseFloat(cols[cantidadIdx] ?? "") : NaN;

      // Unit selling price = "Valor en inventario" / "Cantidad"
      // (In Fina, "Valor en inventario" at variation level = unit cost × qty)
      const price = !isNaN(valorRaw) && !isNaN(cantRaw) && cantRaw > 0
        ? valorRaw / cantRaw
        : !isNaN(costoRaw) ? costoRaw : null;

      currentGroup.variations.push({
        size: nombre,
        costo: isNaN(costoRaw) ? null : costoRaw,
        price,
        storeCantidades: storeMappings.map((m) => {
          const raw = (cols[m.colIdx] ?? "").replace(/"/g, "").trim();
          const qty = raw === "" ? 0 : parseInt(raw, 10);
          return { storeId: m.storeId, storeName: m.storeName, cantidad: isNaN(qty) ? 0 : qty };
        }),
      });
    }
  }

  // ── Process each group ──────────────────────────────────────────────────────
  const results: FinaNativoRowResult[] = [];
  // Track products / options created in this batch
  const batchCreated = new Map<string, { productId: string; optionId: string }>();

  for (const group of groups) {
    const parentSku = group.itemSku.trim().toUpperCase();
    const parentNombre = group.itemNombre.trim().toUpperCase();
    const itemKey = parentSku || parentNombre;
    if (!itemKey) continue;

    const hasSku = parentSku.length > 0;

    for (const variation of group.variations) {
      const { size, costo, price, storeCantidades } = variation;
      if (!size) continue;

      // Build candidates:
      // 1. If SKU exists → try by SKU first ({SKU}-{size})
      // 2. Then by name ({nombre}-{size})
      // 3. Bare parent SKU as last resort (single-variant products)
      const candidatesBySku: string[] = hasSku
        ? [`${parentSku}-${size}`, `${parentSku}_${size}`]
        : [];
      const candidatesByName: string[] = [
        `${parentNombre}-${size}`,
        `${parentNombre}_${size}`,
      ];
      const candidatesFallback: string[] = hasSku ? [parentSku] : [];

      const allCandidates = [...candidatesBySku, ...candidatesByName, ...candidatesFallback];

      // Try to find existing variant
      let variantId: string | null = null;
      let matchedSku = "";
      let matchedBy: "sku" | "name" = "sku";

      for (let ci = 0; ci < allCandidates.length; ci++) {
        const c = allCandidates[ci]!;
        const { data } = await service
          .from("product_variants")
          .select("id")
          .ilike("sku", c)
          .maybeSingle();
        if (data) {
          variantId = data.id;
          matchedSku = c;
          matchedBy = ci < candidatesBySku.length ? "sku" : "name";
          break;
        }
      }

      // ── CASE 1: variant found → update inventory ─────────────────────────
      if (variantId) {
        if (costo !== null && costo >= 0) {
          await service.from("product_variants").update({ cost_usd: costo }).eq("id", variantId);
        }

        const storeResults: FinaNativoStoreResult[] = [];
        let hasError = false;

        for (const sc of storeCantidades) {
          if (sc.cantidad < 0) continue;
          try {
            const { data: inv } = await service
              .from("inventory")
              .select("id, quantity_on_hand")
              .eq("variant_id", variantId)
              .eq("store_id", sc.storeId)
              .maybeSingle();

            const prevQty = inv?.quantity_on_hand ?? 0;
            const delta = sc.cantidad - prevQty;

            if (inv) {
              await service
                .from("inventory")
                .update({ quantity_on_hand: sc.cantidad, updated_at: new Date().toISOString() })
                .eq("id", inv.id);
            } else {
              await service.from("inventory").insert({
                variant_id: variantId,
                store_id: sc.storeId,
                quantity_on_hand: sc.cantidad,
              });
            }

            if (delta !== 0) {
              await service.from("inventory_movements").insert({
                variant_id: variantId,
                store_id: sc.storeId,
                type: "ajuste",
                quantity_delta: delta,
                reason: "Importación nativa Fina",
                previous_quantity: prevQty,
                new_quantity: sc.cantidad,
                user_id: user.id,
              });
            }

            storeResults.push({ storeName: sc.storeName, previousQty: prevQty, newQty: sc.cantidad });
          } catch (e) {
            results.push({
              item: group.itemNombre, size, candidateSku: matchedSku, matchedBy,
              status: "error", message: e instanceof Error ? e.message : "Error",
            });
            hasError = true;
            break;
          }
        }

        if (!hasError) {
          results.push({
            item: group.itemNombre, size, candidateSku: matchedSku, matchedBy,
            status: "updated", storeResults,
          });
        }
        continue;
      }

      // ── CASE 2: not found — report as "not_found" with helpful message ───
      if (!createMissing) {
        const hint = hasSku
          ? `SKU "${parentSku}" no existe. Se buscó también por nombre.`
          : `Sin SKU. Se buscó por nombre "${parentNombre}". Activa "Crear productos" o asigna un SKU manualmente.`;
        results.push({
          item: group.itemNombre, size,
          candidateSku: allCandidates[0] ?? "",
          status: "not_found",
          message: hint,
        });
        continue;
      }

      // ── CASE 3: create product + variant + inventory ─────────────────────
      try {
        let productId: string;
        let optionId: string;

        if (batchCreated.has(itemKey)) {
          const cached = batchCreated.get(itemKey)!;
          productId = cached.productId;
          optionId = cached.optionId;
        } else {
          // Try to find existing product by parent SKU (partial-import case)
          let existingProductId: string | null = null;
          if (hasSku) {
            const { data: ep } = await service
              .from("products")
              .select("id")
              .ilike("sku", parentSku)
              .maybeSingle();
            if (ep) existingProductId = ep.id;
          }

          if (existingProductId) {
            // Product exists — find or create "Talla" option
            productId = existingProductId;
            const { data: existingOpt } = await service
              .from("product_options")
              .select("id")
              .eq("product_id", productId)
              .ilike("name", "talla")
              .maybeSingle();

            if (existingOpt) {
              optionId = existingOpt.id;
            } else {
              const { data: newOpt, error: optErr } = await service
                .from("product_options")
                .insert({ product_id: productId, name: "Talla", order: 1 })
                .select("id")
                .single();
              if (optErr || !newOpt) throw new Error(optErr?.message ?? "Error creando opción Talla");
              optionId = newOpt.id;
            }
          } else {
            // Create new product
            const productName = parentSku || parentNombre;
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
            productId = newProduct.id;

            const { data: newOpt, error: optErr } = await service
              .from("product_options")
              .insert({ product_id: productId, name: "Talla", order: 1 })
              .select("id")
              .single();
            if (optErr || !newOpt) throw new Error(optErr?.message ?? "Error creando opción Talla");
            optionId = newOpt.id;
          }

          batchCreated.set(itemKey, { productId, optionId });
        }

        // Option value for this size
        const { data: newOptVal, error: ovErr } = await service
          .from("product_option_values")
          .insert({ option_id: optionId, value: size, order: group.variations.indexOf(variation) + 1 })
          .select("id")
          .single();
        if (ovErr || !newOptVal) throw new Error(ovErr?.message ?? "Error creando talla");

        // Variant — price_usd from "Valor en inventario" / "Cantidad"
        const variantSku = hasSku
          ? `${parentSku}-${size}`
          : `${parentNombre}-${size}`;

        const { data: newVariant, error: varErr } = await service
          .from("product_variants")
          .insert({
            product_id: productId,
            sku: variantSku,
            price_usd: price ?? 0,
            cost_usd: costo,
            status: "active",
          })
          .select("id")
          .single();
        if (varErr || !newVariant) throw new Error(varErr?.message ?? "Error creando variante");

        // Link variant ↔ option value
        await service.from("variant_option_values").insert({
          variant_id: newVariant.id,
          option_value_id: newOptVal.id,
        });

        // Inventory per store
        const storeResults: FinaNativoStoreResult[] = [];
        for (const sc of storeCantidades) {
          if (sc.cantidad < 0) continue;
          await service.from("inventory").insert({
            variant_id: newVariant.id,
            store_id: sc.storeId,
            quantity_on_hand: sc.cantidad,
          });
          if (sc.cantidad > 0) {
            await service.from("inventory_movements").insert({
              variant_id: newVariant.id,
              store_id: sc.storeId,
              type: "entrada",
              quantity_delta: sc.cantidad,
              reason: "Importación inicial desde Fina",
              previous_quantity: 0,
              new_quantity: sc.cantidad,
              user_id: user.id,
            });
          }
          storeResults.push({ storeName: sc.storeName, previousQty: 0, newQty: sc.cantidad });
        }

        results.push({
          item: group.itemNombre,
          size,
          candidateSku: variantSku,
          matchedBy: hasSku ? "sku" : "name",
          status: "created",
          storeResults,
        });
      } catch (e) {
        results.push({
          item: group.itemNombre, size,
          candidateSku: allCandidates[0] ?? "",
          status: "error",
          message: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    }
  }

  return NextResponse.json({
    total: results.length,
    updated: results.filter((r) => r.status === "updated").length,
    created: results.filter((r) => r.status === "created").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    detectedStores: storeMappings.map((m) => `${m.colLabel} → ${m.storeName}`),
    unknownStoreColumns,
    results,
  } satisfies FinaNativoImportResponse);
}
