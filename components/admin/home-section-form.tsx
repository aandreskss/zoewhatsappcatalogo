"use client";

import { useActionState } from "react";
import {
  createHomeSection,
  type FormState,
} from "@/app/admin/(protected)/marketing/home/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

const TYPE_HINTS: Record<string, string> = {
  hero: '{"imageUrl": "...", "imageMobileUrl": "...", "ctaLabel": "Ver catálogo", "ctaUrl": "/catalogo"}',
  banner: '{"position": "home"}',
  categories: '{"categoryIds": ["..."], "limit": 8}  (vacío = todas las activas)',
  product_slider:
    '{"mode": "featured|new|bestseller|category|manual", "categorySlug": "...", "productIds": ["..."], "limit": 12}',
  collection: '{"collectionSlug": "novedades-2026", "limit": 12}',
  image_text:
    '{"imageUrl": "...", "ctaLabel": "...", "ctaUrl": "...", "align": "left|right"}',
  cta: '{"ctaLabel": "...", "ctaUrl": "...", "imageUrl": "..."}',
  brands: '{"limit": 12}',
  stores: "{}",
  features: '{"items": [{"title": "...", "description": "..."}]}',
  testimonials: '{"items": [{"quote": "...", "author": "..."}]}',
  instagram: '{"items": [{"imageUrl": "...", "linkUrl": "..."}]}',
};

export function HomeSectionForm() {
  const [state, formAction, isPending] = useActionState(createHomeSection, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="type">Tipo de bloque</Label>
          <select
            id="type"
            name="type"
            disabled={isPending}
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm"
          >
            {Object.keys(TYPE_HINTS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input id="title" name="title" disabled={isPending} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
        <Input id="subtitle" name="subtitle" disabled={isPending} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="config">Configuración (JSON)</Label>
        <textarea
          id="config"
          name="config"
          rows={2}
          placeholder="{}"
          disabled={isPending}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 font-mono text-xs"
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Formas esperadas por tipo — copia y ajusta:{" "}
          {Object.entries(TYPE_HINTS)
            .map(([type, hint]) => `${type}: ${hint}`)
            .join(" · ")}
        </p>
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="self-start">
        {isPending ? "Agregando…" : "Agregar bloque"}
      </Button>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]">{state.error}</p>
      ) : null}
    </form>
  );
}
