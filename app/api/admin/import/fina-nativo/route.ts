import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";
import {
  fileToRows,
  normalizeHeader,
  storeMatchesColumn,
  isKnownNonStore,
  type ColumnRole,
} from "@/lib/domain/fina-nativo-helpers";

// ── Public types ─────────────────────────────────────────────────────────────

export interface FinaNativoStoreResult {
  storeName: string;
  previousQty: number;
  newQty: number;
}

export interface FinaNativoRowResult {
  item: string;
  size: string;
  candidateSku: string;
  matchedBy?: "sku" | "name";
  status: "updated" | "created" | "not_found" | "skipped" | "error";
  message?: string;
  storeResults?: FinaNativoStoreResult[];
}

export interface FinaNativoImportResponse {
  total: number;
  updated: number;
  notFound: number;
  skipped: number;
  errors: number;
  detectedStores: string[];
  unknownStoreColumns: string[];
  results: FinaNativoRowResult[];
}

// ── Internal types ────────────────────────────────────────────────────────────

interface StoreColMapping {
  colIdx: number;
  colLabel: string;
  storeId: string;
  storeName: string;
}

interface VariationRow {
  size: string;
  costo: number | null;
  price: number | null;
  storeCantidades: { storeId: string; storeName: string; cantidad: number }[];
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

  const fallbackStoreId = (formData.get("fallback_store_id") as string | null)?.trim() || null;

  // Optional explicit column mapping from the UI mapping step
  const columnMappingRaw = formData.get("column_mapping") as string | null;
  let explicitMapping: Record<string, ColumnRole> | null = null;
  if (columnMappingRaw) {
    try {
      explicitMapping = JSON.parse(columnMappingRaw) as Record<string, ColumnRole>;
    } catch {
      return NextResponse.json({ error: "column_mapping JSON inválido" }, { status: 400 });
    }
  }

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

  // ── Build column indices ────────────────────────────────────────────────────
  let tipoIdx = -1, nombreIdx = -1, skuIdx = -1, costoIdx = -1,
    categoriaIdx = -1, cantidadIdx = -1, valorIdx = -1;

  if (explicitMapping) {
    for (const [idxStr, role] of Object.entries(explicitMapping)) {
      const idx = parseInt(idxStr);
      if (isNaN(idx) || idx < 0 || idx >= rawHeaders.length) continue;
      if (role.type !== "field") continue;
      switch (role.field) {
        case "tipo": tipoIdx = idx; break;
        case "nombre": nombreIdx = idx; break;
        case "sku": skuIdx = idx; break;
        case "categoria": categoriaIdx = idx; break;
        case "costo_unitario": costoIdx = idx; break;
        case "valor_inventario": valorIdx = idx; break;
        case "cantidad": cantidadIdx = idx; break;
      }
    }
  } else {
    tipoIdx = normHeaders.indexOf("tipo");
    nombreIdx = normHeaders.indexOf("nombre");
    skuIdx = normHeaders.indexOf("sku");
    costoIdx = normHeaders.indexOf("costounitario");
    categoriaIdx = normHeaders.indexOf("categoria");
    cantidadIdx = normHeaders.indexOf("cantidad");
    valorIdx = normHeaders.findIndex(
      (h) => h.startsWith("valoren") || h.startsWith("valorin"),
    );
  }

  if (tipoIdx === -1 || nombreIdx === -1) {
    return NextResponse.json(
      {
        error: `No es un inventario de Fina válido. Se esperan columnas "Tipo" y "Nombre". Detectadas: ${rawHeaders.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceRoleClient();
  const { data: allStores } = await service.from("stores").select("id, name, code").eq("active", true);
  const stores = allStores ?? [];

  // ── Build store mappings ────────────────────────────────────────────────────
  const storeMappings: StoreColMapping[] = [];
  const unknownStoreColumns: string[] = [];

  if (explicitMapping) {
    for (const [idxStr, role] of Object.entries(explicitMapping)) {
      if (role.type !== "store") continue;
      const idx = parseInt(idxStr);
      if (isNaN(idx) || idx < 0 || idx >= rawHeaders.length) continue;
      storeMappings.push({
        colIdx: idx,
        colLabel: rawHeaders[idx]!,
        storeId: role.storeId,
        storeName: role.storeName,
      });
    }
  } else {
    for (let i = 0; i < rawHeaders.length; i++) {
      const normKey = normHeaders[i]!;
      if (isKnownNonStore(normKey)) continue;
      const matched = stores.find((s) =>
        storeMatchesColumn(s.name, s.code ?? null, rawHeaders[i]!),
      );
      if (matched) {
        if (!storeMappings.some((m) => m.storeId === matched.id)) {
          storeMappings.push({
            colIdx: i,
            colLabel: rawHeaders[i]!,
            storeId: matched.id,
            storeName: matched.name,
          });
        }
      } else {
        unknownStoreColumns.push(rawHeaders[i]!);
      }
    }
    // Fallback: if no store columns detected, use total "Cantidad" for one store
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

      const price =
        !isNaN(valorRaw) && !isNaN(cantRaw) && cantRaw > 0
          ? valorRaw / cantRaw
          : !isNaN(costoRaw)
            ? costoRaw
            : null;

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

  for (const group of groups) {
    const parentSku = group.itemSku.trim().toUpperCase();
    const parentNombreRaw = group.itemNombre.trim();
    const parentNombre = parentNombreRaw.toUpperCase();
    const itemKey = parentSku || parentNombre;
    if (!itemKey) continue;

    const hasSku = parentSku.length > 0;

    for (const variation of group.variations) {
      const { size, costo, price, storeCantidades } = variation;
      if (!size) continue;

      const candidatesBySku: string[] = hasSku
        ? [`${parentSku}-${size}`, `${parentSku}_${size}`]
        : [];
      const candidatesByName: string[] = [
        `${parentNombre}-${size}`,
        `${parentNombre}_${size}`,
      ];
      const candidatesFallback: string[] = hasSku ? [parentSku] : [];
      const allCandidates = [...candidatesBySku, ...candidatesByName, ...candidatesFallback];

      let variantId: string | null = null;
      let matchedSku = "";
      let matchedBy: "sku" | "name" = "sku";

      for (let ci = 0; ci < allCandidates.length; ci++) {
        const c = allCandidates[ci]!;
        const { data } = await service
          .from("product_variants")
          .select("id, product_id")
          .ilike("sku", c)
          .maybeSingle();
        if (!data) continue;
        // Skip variants whose parent product is soft-deleted
        const { data: liveProd } = await service
          .from("products")
          .select("id")
          .eq("id", data.product_id)
          .is("deleted_at", null)
          .maybeSingle();
        if (liveProd) {
          variantId = data.id;
          matchedSku = c;
          matchedBy = ci < candidatesBySku.length ? "sku" : "name";
          break;
        }
      }

      // ── CASE 1: variant found → update inventory ──────────────────────────
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

      // ── CASE 2: not found ─────────────────────────────────────────────────
      const hint = hasSku
        ? `SKU "${parentSku}" no existe. Se buscó también por nombre.`
        : `Sin SKU. Se buscó por nombre "${parentNombre}". Verifica los SKUs en Admin → Productos.`;
      results.push({
        item: group.itemNombre, size,
        candidateSku: allCandidates[0] ?? "",
        status: "not_found",
        message: hint,
      });
    }
  }

  revalidatePath("/admin/inventario");

  return NextResponse.json({
    total: results.length,
    updated: results.filter((r) => r.status === "updated").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    detectedStores: storeMappings.map((m) => `${m.colLabel} → ${m.storeName}`),
    unknownStoreColumns,
    results,
  } satisfies FinaNativoImportResponse);
}
