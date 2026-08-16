import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getAdminSessionUser } from "@/lib/auth/session";
import {
  fileToRows,
  normalizeHeader,
  isKnownNonStore,
  storeMatchesColumn,
  type ColumnRole,
} from "@/lib/domain/fina-nativo-helpers";

// ── Public types ──────────────────────────────────────────────────────────────

export interface FinaNativoColumn {
  index: number;
  label: string;
  samples: string[];
}

export interface FinaNativoPreviewResponse {
  columns: FinaNativoColumn[];
  suggestedMapping: Record<string, ColumnRole>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSuggestedFieldRole(normKey: string): ColumnRole | null {
  if (normKey === "tipo") return { type: "field", field: "tipo" };
  if (normKey === "nombre") return { type: "field", field: "nombre" };
  if (normKey === "sku") return { type: "field", field: "sku" };
  if (normKey === "categoria") return { type: "field", field: "categoria" };
  if (normKey === "costounitario") return { type: "field", field: "costo_unitario" };
  if (normKey === "cantidad") return { type: "field", field: "cantidad" };
  if (normKey === "sinubicacion") return { type: "field", field: "sin_ubicacion" };
  if (normKey === "cualquiera") return { type: "field", field: "cualquiera" };
  if (normKey.startsWith("valoren") || normKey.startsWith("valorin"))
    return { type: "field", field: "valor_inventario" };
  return null;
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
    return NextResponse.json(
      { error: "El archivo está vacío o solo tiene encabezados" },
      { status: 400 },
    );

  const rawHeaders = rows[0]!;
  const normHeaders = rawHeaders.map(normalizeHeader);
  // First 5 data rows for samples
  const dataRows = rows.slice(1, 6);

  const service = createSupabaseServiceRoleClient();
  const { data: allStores } = await service
    .from("stores")
    .select("id, name, code")
    .eq("active", true);
  const stores = allStores ?? [];

  const columns: FinaNativoColumn[] = rawHeaders.map((label, index) => ({
    index,
    label,
    samples: dataRows
      .map((row) => (row[index] ?? "").trim())
      .filter((v) => v !== ""),
  }));

  const suggestedMapping: Record<string, ColumnRole> = {};

  for (let i = 0; i < rawHeaders.length; i++) {
    const normKey = normHeaders[i]!;

    const fieldRole = getSuggestedFieldRole(normKey);
    if (fieldRole) {
      suggestedMapping[i] = fieldRole;
      continue;
    }

    if (isKnownNonStore(normKey)) {
      suggestedMapping[i] = { type: "ignore" };
      continue;
    }

    const matched = stores.find((s) =>
      storeMatchesColumn(s.name, s.code ?? null, rawHeaders[i]!),
    );
    if (matched) {
      suggestedMapping[i] = { type: "store", storeId: matched.id, storeName: matched.name };
    } else {
      suggestedMapping[i] = { type: "ignore" };
    }
  }

  return NextResponse.json(
    { columns, suggestedMapping } satisfies FinaNativoPreviewResponse,
  );
}
