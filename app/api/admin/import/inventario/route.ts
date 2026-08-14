import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";

export interface ImportRowResult {
  sku: string;
  store?: string;
  status: "updated" | "not_found" | "skipped" | "error";
  message?: string;
  previousQuantity?: number;
  newQuantity?: number;
}

export interface ImportResponse {
  total: number;
  updated: number;
  notFound: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
}

// Normalize a CSV header: lowercase, trim, strip accents / special chars
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

function findCol(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h));
}

// Splits a CSV line respecting quoted fields
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

export async function POST(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  const mode = formData.get("mode") as string | null; // "single" | "multi"
  const singleStoreId = formData.get("store_id") as string | null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }
  if (!mode || !["single", "multi"].includes(mode)) {
    return NextResponse.json({ error: "Modo de importación inválido" }, { status: 400 });
  }
  if (mode === "single" && !singleStoreId) {
    return NextResponse.json({ error: "Selecciona una sucursal" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "El CSV está vacío o solo tiene encabezados" }, { status: 400 });
  }

  const rawHeaders = parseCsvLine(lines[0]!);
  const headers = rawHeaders.map(normalizeHeader);

  const skuIdx = findCol(headers, ["sku", "codigo", "code"]);
  const cantidadIdx = findCol(headers, ["cantidad", "stock", "existencia", "qty", "quantity"]);
  const costoIdx = findCol(headers, ["precio_costo", "costo", "cost", "preciocosto"]);
  const ventaIdx = findCol(headers, ["precio_venta", "precio", "price", "precioventa"]);
  // For multi-store mode: CSV must include a store_code or store column
  const storeIdx = findCol(headers, ["tienda", "sucursal", "store", "store_code", "codigo_tienda"]);

  if (skuIdx === -1) {
    return NextResponse.json(
      { error: `Columna "sku" no encontrada. Columnas detectadas: ${headers.join(", ")}` },
      { status: 400 },
    );
  }
  if (cantidadIdx === -1) {
    return NextResponse.json(
      { error: `Columna "cantidad" no encontrada. Columnas detectadas: ${headers.join(", ")}` },
      { status: 400 },
    );
  }
  if (mode === "multi" && storeIdx === -1) {
    return NextResponse.json(
      { error: `En modo multi-sucursal el CSV debe incluir una columna "tienda" con el código de cada sucursal. Columnas detectadas: ${headers.join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const service = createSupabaseServiceRoleClient();

  // Pre-load store codes if multi mode
  let storeCodeMap: Record<string, string> = {}; // code → id
  if (mode === "multi") {
    const { data: stores } = await supabase.from("stores").select("id, code");
    for (const s of stores ?? []) {
      if (s.code) storeCodeMap[s.code.toUpperCase()] = s.id;
    }
  }

  const results: ImportRowResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const sku = cols[skuIdx]?.trim();
    if (!sku) continue;

    const cantidadRaw = cols[cantidadIdx]?.trim();
    const cantidad = parseInt(cantidadRaw ?? "", 10);
    if (isNaN(cantidad) || cantidad < 0) {
      results.push({ sku, status: "skipped", message: `Cantidad inválida: "${cantidadRaw}"` });
      continue;
    }

    let storeId: string = singleStoreId ?? "";
    if (mode === "multi") {
      const storeCode = (cols[storeIdx] ?? "").trim().toUpperCase();
      storeId = storeCodeMap[storeCode] ?? "";
      if (!storeId) {
        results.push({
          sku,
          store: (cols[storeIdx] ?? "").trim(),
          status: "skipped",
          message: `Código de tienda no encontrado`,
        });
        continue;
      }
    }

    try {
      const { data: variant } = await service
        .from("product_variants")
        .select("id")
        .eq("sku", sku)
        .maybeSingle();

      if (!variant) {
        results.push({ sku, status: "not_found", message: "SKU no existe en el catálogo" });
        continue;
      }

      const { data: inv } = await service
        .from("inventory")
        .select("id, quantity_on_hand")
        .eq("variant_id", variant.id)
        .eq("store_id", storeId)
        .maybeSingle();

      const previousQty = inv?.quantity_on_hand ?? 0;
      const delta = cantidad - previousQty;

      if (inv) {
        await service
          .from("inventory")
          .update({ quantity_on_hand: cantidad, updated_at: new Date().toISOString() })
          .eq("id", inv.id);
      } else {
        await service.from("inventory").insert({
          variant_id: variant.id,
          store_id: storeId,
          quantity_on_hand: cantidad,
        });
      }

      if (delta !== 0) {
        await service.from("inventory_movements").insert({
          variant_id: variant.id,
          store_id: storeId,
          type: "ajuste",
          quantity_delta: delta,
          reason: "Importación masiva desde Fina Partner",
          previous_quantity: previousQty,
          new_quantity: cantidad,
          user_id: user.id,
        });
      }

      // Optional: update cost / price
      const costUpdate = costoIdx !== -1 ? parseFloat(cols[costoIdx] ?? "") : NaN;
      const priceUpdate = ventaIdx !== -1 ? parseFloat(cols[ventaIdx] ?? "") : NaN;
      const hasCost = !isNaN(costUpdate) && costUpdate >= 0;
      const hasPrice = !isNaN(priceUpdate) && priceUpdate > 0;
      if (hasCost && hasPrice) {
        await service.from("product_variants").update({ cost_usd: costUpdate, price_usd: priceUpdate }).eq("id", variant.id);
      } else if (hasCost) {
        await service.from("product_variants").update({ cost_usd: costUpdate }).eq("id", variant.id);
      } else if (hasPrice) {
        await service.from("product_variants").update({ price_usd: priceUpdate }).eq("id", variant.id);
      }

      results.push({ sku, status: "updated", previousQuantity: previousQty, newQuantity: cantidad });
    } catch (e) {
      results.push({
        sku,
        status: "error",
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  const response: ImportResponse = {
    total: results.length,
    updated: results.filter((r) => r.status === "updated").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  };

  return NextResponse.json(response);
}
