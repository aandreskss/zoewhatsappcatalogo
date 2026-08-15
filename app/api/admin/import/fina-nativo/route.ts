import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";

export interface FinaNativoStoreResult {
  storeName: string;
  previousQty: number;
  newQty: number;
}

export interface FinaNativoRowResult {
  item: string;
  size: string;
  candidateSku: string;
  status: "updated" | "not_found" | "skipped" | "error";
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
  results: FinaNativoRowResult[];
}

// Strips accents and lowercases, preserving spaces
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

// Normalizes a CSV header to a compact key (no spaces, no accents)
function normalizeHeader(h: string): string {
  return normalizeForMatch(h).replace(/\s+/g, "");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

// Fina CSV non-store columns (normalized compact keys)
const SKIP_COLS = new Set([
  "tipo", "nombre", "sku", "categoria", "costounitario",
  "unidad", "cantidad", "valorenventario", "valorenInventario",
  "valorenineventario", "valorinventario", "valorenInventario",
  "sinubicacion", "cualquiera",
]);

function isNonStoreColumn(normKey: string): boolean {
  // Exact match against known non-store columns
  if (SKIP_COLS.has(normKey)) return true;
  // Variants like "valorenventario", "valorenInventario" etc.
  if (normKey.startsWith("valoren")) return true;
  return false;
}

// Returns true if a store's name contains any significant word (>3 chars) from the column label
function storeMatchesColumn(storeName: string, columnLabel: string): boolean {
  const storeNorm = normalizeForMatch(storeName);
  const colNorm = normalizeForMatch(columnLabel);
  const significantWords = colNorm.split(" ").filter((w) => w.length > 3);
  if (significantWords.length === 0) return false;
  return significantWords.some((word) => storeNorm.includes(word));
}

interface StoreColMapping {
  colIdx: number;
  colLabel: string;
  storeId: string;
  storeName: string;
}

interface VariationRow {
  size: string;
  costo: number | null;
  storeCantidades: { storeId: string; storeName: string; cantidad: number }[];
}

interface ItemGroup {
  itemNombre: string;
  itemSku: string;
  variations: VariationRow[];
}

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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "El CSV está vacío o solo tiene encabezados" }, { status: 400 });
  }

  const rawHeaders = parseCsvLine(lines[0]!);
  const normHeaders = rawHeaders.map(normalizeHeader);

  // Validate Fina native format
  const tipoIdx = normHeaders.indexOf("tipo");
  const nombreIdx = normHeaders.indexOf("nombre");
  if (tipoIdx === -1 || nombreIdx === -1) {
    return NextResponse.json(
      {
        error: `No parece ser un CSV nativo de Fina. Se esperan columnas "Tipo" y "Nombre". Columnas detectadas: ${rawHeaders.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const skuIdx = normHeaders.indexOf("sku");
  const costoIdx = normHeaders.indexOf("costounitario");

  // Load active stores
  const service = createSupabaseServiceRoleClient();
  const { data: allStores } = await service.from("stores").select("id, name, code").eq("active", true);
  const stores = allStores ?? [];

  // Map CSV columns to stores (skip known non-store columns)
  const storeMappings: StoreColMapping[] = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    const normKey = normHeaders[i]!;
    if (isNonStoreColumn(normKey)) continue;
    const colLabel = rawHeaders[i]!;
    const matched = stores.find((s) => storeMatchesColumn(s.name, colLabel));
    if (matched) {
      storeMappings.push({ colIdx: i, colLabel, storeId: matched.id, storeName: matched.name });
    }
  }

  // Parse CSV into Item+Variation groups
  const groups: ItemGroup[] = [];
  let currentGroup: ItemGroup | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const tipo = (cols[tipoIdx] ?? "").trim().toLowerCase();
    const nombre = (cols[nombreIdx] ?? "").trim();

    if (tipo === "item") {
      currentGroup = {
        itemNombre: nombre,
        itemSku: skuIdx !== -1 ? (cols[skuIdx] ?? "").trim() : "",
        variations: [],
      };
      groups.push(currentGroup);
    } else if (tipo === "variacion" && currentGroup) {
      const costoRaw = costoIdx !== -1 ? parseFloat(cols[costoIdx] ?? "") : NaN;

      const storeCantidades = storeMappings.map((m) => {
        const raw = (cols[m.colIdx] ?? "").replace(/"/g, "").trim();
        const cantidad = raw === "" ? 0 : parseInt(raw, 10);
        return { storeId: m.storeId, storeName: m.storeName, cantidad: isNaN(cantidad) ? 0 : cantidad };
      });

      currentGroup.variations.push({
        size: nombre,
        costo: isNaN(costoRaw) ? null : costoRaw,
        storeCantidades,
      });
    }
  }

  // Process each variation
  const results: FinaNativoRowResult[] = [];

  for (const group of groups) {
    for (const variation of group.variations) {
      const parentSku = group.itemSku.trim().toUpperCase();
      const parentNombre = group.itemNombre.trim().toUpperCase();
      const size = variation.size;

      // Build candidate SKUs in priority order
      const candidates: string[] = [];
      if (parentSku) {
        candidates.push(`${parentSku}-${size}`);
        candidates.push(`${parentSku}_${size}`);
      }
      candidates.push(`${parentNombre}-${size}`);
      candidates.push(`${parentNombre}_${size}`);
      if (parentSku) candidates.push(parentSku);

      // Try each candidate (case-insensitive)
      let variantId: string | null = null;
      let matchedSku = "";
      for (const candidate of candidates) {
        const { data } = await service
          .from("product_variants")
          .select("id")
          .ilike("sku", candidate)
          .maybeSingle();
        if (data) {
          variantId = data.id;
          matchedSku = candidate;
          break;
        }
      }

      if (!variantId) {
        results.push({
          item: group.itemNombre,
          size,
          candidateSku: candidates[0] ?? "",
          status: "not_found",
          message: `Probados: ${candidates.slice(0, 3).join(", ")}`,
        });
        continue;
      }

      // Update cost if present
      if (variation.costo !== null && variation.costo >= 0) {
        await service
          .from("product_variants")
          .update({ cost_usd: variation.costo })
          .eq("id", variantId);
      }

      // Update inventory per store
      const storeResults: FinaNativoStoreResult[] = [];
      let hasError = false;

      for (const sc of variation.storeCantidades) {
        if (sc.cantidad < 0) continue;

        try {
          const { data: inv } = await service
            .from("inventory")
            .select("id, quantity_on_hand")
            .eq("variant_id", variantId)
            .eq("store_id", sc.storeId)
            .maybeSingle();

          const previousQty = inv?.quantity_on_hand ?? 0;
          const delta = sc.cantidad - previousQty;

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
              reason: "Importación nativa desde Fina Partner",
              previous_quantity: previousQty,
              new_quantity: sc.cantidad,
              user_id: user.id,
            });
          }

          storeResults.push({ storeName: sc.storeName, previousQty, newQty: sc.cantidad });
        } catch (e) {
          results.push({
            item: group.itemNombre,
            size,
            candidateSku: matchedSku,
            status: "error",
            message: e instanceof Error ? e.message : "Error desconocido",
          });
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        results.push({
          item: group.itemNombre,
          size,
          candidateSku: matchedSku,
          status: "updated",
          storeResults,
        });
      }
    }
  }

  const response: FinaNativoImportResponse = {
    total: results.length,
    updated: results.filter((r) => r.status === "updated").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    detectedStores: storeMappings.map((m) => `${m.colLabel} → ${m.storeName}`),
    results,
  };

  return NextResponse.json(response);
}
