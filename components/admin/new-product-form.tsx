"use client";

import { useActionState } from "react";
import { createProduct, type FormState } from "@/app/admin/(protected)/productos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

export function NewProductForm({
  brands,
  categories,
}: {
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createProduct, initialState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU (opcional)</Label>
        <Input id="sku" name="sku" disabled={isPending} />
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
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
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
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
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
        <Input id="descriptionShort" name="descriptionShort" disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción completa</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          disabled={isPending}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando…" : "Crear como borrador"}
      </Button>
    </form>
  );
}
