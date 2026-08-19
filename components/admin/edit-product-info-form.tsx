"use client";

import { useActionState, useRef, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { updateProductInfoAction, type FormState } from "@/app/admin/(protected)/productos/actions";

const GENDERS = [
  { value: "", label: "—" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "nino", label: "Niño" },
  { value: "nina", label: "Niña" },
] as const;

const SELECT_CLS =
  "h-10 w-full rounded-xl border border-[#EBE4E1] bg-white px-3 text-sm text-[#29252A] outline-none transition-colors hover:border-[#C9748A]/40 focus:ring-2 focus:ring-[#C9748A]/25";
const INPUT_CLS =
  "h-10 w-full rounded-xl border border-[#EBE4E1] bg-white px-3 text-sm text-[#29252A] outline-none transition-colors placeholder:text-[#29252A]/30 hover:border-[#C9748A]/40 focus:ring-2 focus:ring-[#C9748A]/25";
const LABEL_CLS = "block text-xs font-semibold uppercase tracking-wider text-[#29252A]/50";

const initialState: FormState = { error: null };

export function EditProductInfoForm({
  productId,
  product,
  brands,
  categories,
}: {
  productId: string;
  product: {
    name: string;
    sku: string | null;
    brand_id: string | null;
    category_id: string | null;
    gender: string | null;
    description_short: string | null;
    description: string | null;
    material: string | null;
    is_new: boolean;
    seo_title: string | null;
    seo_description: string | null;
  };
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const action = updateProductInfoAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const hasSubmitted = useRef(false);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending) hasSubmitted.current = true;
    wasPending.current = isPending;
  });

  const showSuccess = hasSubmitted.current && !isPending && state.error === null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Row 1: name + sku */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="pi-name" className={LABEL_CLS}>Nombre</label>
          <input
            id="pi-name"
            name="name"
            required
            defaultValue={product.name}
            disabled={isPending}
            placeholder="Ej: Sandalia Milano Nude"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pi-sku" className={LABEL_CLS}>SKU del producto</label>
          <input
            id="pi-sku"
            name="sku"
            defaultValue={product.sku ?? ""}
            disabled={isPending}
            placeholder="Ej: ML-001"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Row 2: brand + category + gender */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pi-brand" className={LABEL_CLS}>Marca</label>
          <select id="pi-brand" name="brandId" defaultValue={product.brand_id ?? ""} disabled={isPending} className={SELECT_CLS}>
            <option value="">Sin marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pi-category" className={LABEL_CLS}>Categoría</label>
          <select id="pi-category" name="categoryId" defaultValue={product.category_id ?? ""} disabled={isPending} className={SELECT_CLS}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pi-gender" className={LABEL_CLS}>Género</label>
          <select id="pi-gender" name="gender" defaultValue={product.gender ?? ""} disabled={isPending} className={SELECT_CLS}>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: description short */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pi-desc-short" className={LABEL_CLS}>
          Descripción corta
          <span className="ml-1.5 font-normal normal-case text-[#29252A]/30">(máx. 300 caracteres)</span>
        </label>
        <input
          id="pi-desc-short"
          name="descriptionShort"
          defaultValue={product.description_short ?? ""}
          disabled={isPending}
          placeholder="Ej: Sandalia de cuero italiano con hebilla dorada"
          className={INPUT_CLS}
        />
      </div>

      {/* Row 4: description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pi-desc" className={LABEL_CLS}>Descripción completa</label>
        <textarea
          id="pi-desc"
          name="description"
          rows={4}
          defaultValue={product.description ?? ""}
          disabled={isPending}
          placeholder="Descripción detallada del producto, materiales, cuidados…"
          className="w-full resize-none rounded-xl border border-[#EBE4E1] bg-white px-3 py-2.5 text-sm text-[#29252A] outline-none transition-colors placeholder:text-[#29252A]/30 hover:border-[#C9748A]/40 focus:ring-2 focus:ring-[#C9748A]/25 disabled:opacity-50"
        />
      </div>

      {/* Row 5: material + is_new */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pi-material" className={LABEL_CLS}>Material</label>
          <input
            id="pi-material"
            name="material"
            defaultValue={product.material ?? ""}
            disabled={isPending}
            placeholder="Ej: Cuero genuino, suela de goma"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input
            id="pi-is-new"
            name="isNew"
            type="checkbox"
            defaultChecked={product.is_new}
            disabled={isPending}
            className="h-4 w-4 rounded border-[#EBE4E1] accent-[#7B1847]"
          />
          <label htmlFor="pi-is-new" className="text-sm text-[#29252A]">
            Marcar como <span className="font-semibold">Nuevo</span>
          </label>
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-xl border border-[#EBE4E1] bg-[#F4EFEc]/50 px-4 py-4">
        <p className={`${LABEL_CLS} mb-3`}>SEO</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-seo-title" className="text-xs text-[#29252A]/50">Título SEO <span className="text-[#29252A]/30">(máx. 70 caracteres)</span></label>
            <input
              id="pi-seo-title"
              name="seoTitle"
              defaultValue={product.seo_title ?? ""}
              disabled={isPending}
              placeholder={product.name}
              className={INPUT_CLS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-seo-desc" className="text-xs text-[#29252A]/50">Meta descripción <span className="text-[#29252A]/30">(máx. 160 caracteres)</span></label>
            <input
              id="pi-seo-desc"
              name="seoDescription"
              defaultValue={product.seo_description ?? ""}
              disabled={isPending}
              placeholder={product.description_short ?? ""}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      {/* Feedback + submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#7B1847] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7B1847]/85 disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>

        {showSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 size={14} />
            Guardado
          </span>
        )}
        {state.error && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <X size={14} />
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
