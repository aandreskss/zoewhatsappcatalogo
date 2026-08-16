"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createProduct,
  addImageAction,
  type FormState,
} from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { CheckCircle2, ArrowRight, X } from "lucide-react";

const initialState: FormState = { error: null };

// ── Phase 2: image upload ─────────────────────────────────────────────────────

function ImagePhase({ productId, productName }: { productId: string; productName: string }) {
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [uploadKey, setUploadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleUpload(url: string) {
    if (!url) return;
    setSaving(true);
    setSaveError(null);
    const fd = new FormData();
    fd.set("url", url);
    fd.set("altText", productName);
    const result = await addImageAction(productId, { error: null }, fd);
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setSavedUrls((prev) => [...prev, url]);
      setUploadKey((k) => k + 1);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">¡Producto creado!</p>
          <p className="text-xs text-emerald-700">
            Agrega fotos ahora o hazlo más tarde desde la página del producto.
          </p>
        </div>
      </div>

      {/* Saved thumbnails */}
      {savedUrls.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
            Fotos guardadas ({savedUrls.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {savedUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-20 w-20 rounded-lg border border-[var(--color-border)] object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload zone (resets after each save) */}
      <div key={uploadKey}>
        <ImageUpload
          label={savedUrls.length === 0 ? "Foto principal" : "Agregar otra foto"}
          onUpload={handleUpload}
          disabled={saving}
        />
        {saving && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Guardando foto…</p>
        )}
        {saveError && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{saveError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/productos/${productId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7B1847] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7B1847]/80"
        >
          Ir al producto <ArrowRight size={15} />
        </Link>
        <Link
          href="/admin/productos/nuevo"
          className="text-sm text-[var(--color-muted-foreground)] underline hover:text-[var(--color-foreground)]"
        >
          Crear otro producto
        </Link>
      </div>
    </div>
  );
}

// ── Phase 1: product info form ────────────────────────────────────────────────

export function NewProductForm({
  brands,
  categories,
}: {
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createProduct, initialState);

  if (state.productId) {
    return (
      <ImagePhase productId={state.productId} productName={state.productName ?? ""} />
    );
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre del producto</Label>
        <Input id="name" name="name" placeholder="Ej: Sandalia Milano Nude" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU <span className="text-[var(--color-muted-foreground)] font-normal">(opcional)</span></Label>
        <Input id="sku" name="sku" placeholder="Ej: ML-001" disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brandId">Marca</Label>
          <select
            id="brandId"
            name="brandId"
            disabled={isPending}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            <option value="">Sin marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            disabled={isPending}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gender">Género</Label>
        <select
          id="gender"
          name="gender"
          disabled={isPending}
          className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
        >
          <option value="">—</option>
          <option value="mujer">Mujer</option>
          <option value="hombre">Hombre</option>
          <option value="unisex">Unisex</option>
          <option value="nino">Niño</option>
          <option value="nina">Niña</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descriptionShort">Descripción corta</Label>
        <Input
          id="descriptionShort"
          name="descriptionShort"
          placeholder="Ej: Sandalia de cuero italiano con hebilla dorada"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción completa</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          disabled={isPending}
          placeholder="Descripción detallada del producto, materiales, cuidados…"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="material">Material</Label>
        <Input
          id="material"
          name="material"
          placeholder="Ej: Cuero genuino, suela de goma"
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-[var(--color-error)]">
          <X size={14} className="shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Creando…" : "Crear borrador y agregar fotos →"}
      </Button>
    </form>
  );
}
