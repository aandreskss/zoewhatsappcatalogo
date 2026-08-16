import * as XLSX from "xlsx";

// ── Shared types ─────────────────────────────────────────────────────────────

export type ColumnRoleField =
  | "tipo"
  | "nombre"
  | "sku"
  | "categoria"
  | "costo_unitario"
  | "valor_inventario"
  | "cantidad"
  | "sin_ubicacion"
  | "cualquiera";

export type ColumnRole =
  | { type: "field"; field: ColumnRoleField }
  | { type: "store"; storeId: string; storeName: string }
  | { type: "ignore" };

// ── String helpers ────────────────────────────────────────────────────────────

export function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHeader(h: string): string {
  return normalizeForMatch(h).replace(/\s+/g, "");
}

export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── CSV parser ────────────────────────────────────────────────────────────────

export function parseCsvLine(line: string): string[] {
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

// ── File parser ───────────────────────────────────────────────────────────────

export async function fileToRows(file: File): Promise<string[][]> {
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

// ── Column classification ─────────────────────────────────────────────────────

export const KNOWN_NON_STORE_KEYS = new Set([
  "tipo",
  "nombre",
  "sku",
  "categoria",
  "costounitario",
  "unidad",
  "cantidad",
  "sinubicacion",
  "cualquiera",
]);

export function isKnownNonStore(normKey: string): boolean {
  if (KNOWN_NON_STORE_KEYS.has(normKey)) return true;
  if (normKey.startsWith("valoren") || normKey.startsWith("valorin")) return true;
  return false;
}

export function storeMatchesColumn(
  storeName: string,
  storeCode: string | null,
  colLabel: string,
): boolean {
  const colNorm = normalizeForMatch(colLabel);
  const words = colNorm.split(" ").filter((w) => w.length > 3);
  if (words.length === 0) return false;
  const storeNorm = normalizeForMatch(storeName);
  if (words.some((w) => storeNorm.includes(w))) return true;
  if (storeCode) {
    const codeNorm = normalizeForMatch(storeCode);
    if (words.some((w) => codeNorm.includes(w))) return true;
  }
  return false;
}

export function findCategoryId(
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
