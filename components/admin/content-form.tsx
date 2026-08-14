"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  saveSiteContent,
  type ContentFormState,
} from "@/app/admin/(protected)/apariencia/contenido/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { SiteContent } from "@/lib/domain/site-content-types";

const initialState: ContentFormState = { error: null };

export function ContentForm({ current }: { current: SiteContent }) {
  const [state, formAction, isPending] = useActionState(saveSiteContent, initialState);
  const toast = useToast();
  const wasPending = React.useRef(false);

  // Nav link row count — start with however many are in current content (min 1)
  const [rowCount, setRowCount] = React.useState<number>(
    Math.max(1, current.navLinks.length),
  );

  React.useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      toast("Contenido guardado.", "success");
    }
    wasPending.current = isPending;
  }, [isPending, state.error, toast]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b border-[var(--color-border)] pb-2">
          Hero
        </h2>
        <Field label="Etiqueta" name="heroLabel" defaultValue={current.heroLabel} disabled={isPending} />
        <Field label="Título" name="heroTitle" defaultValue={current.heroTitle} disabled={isPending} />
        <TextareaField
          label="Subtítulo"
          name="heroSubtitle"
          defaultValue={current.heroSubtitle}
          disabled={isPending}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Texto del botón CTA" name="heroCtaText" defaultValue={current.heroCtaText} disabled={isPending} />
          <Field label="Enlace del botón CTA" name="heroCtaHref" defaultValue={current.heroCtaHref} disabled={isPending} />
        </div>
      </section>

      {/* ── Catálogo ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b border-[var(--color-border)] pb-2">
          Catálogo
        </h2>
        <Field
          label="Etiqueta de colección"
          name="catalogLabel"
          defaultValue={current.catalogLabel}
          disabled={isPending}
        />
      </section>

      {/* ── Promo Banner ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b border-[var(--color-border)] pb-2">
          Banner promocional
        </h2>
        <Field label="Etiqueta" name="promoLabel" defaultValue={current.promoLabel} disabled={isPending} />
        <Field label="Título" name="promoTitle" defaultValue={current.promoTitle} disabled={isPending} />
        <TextareaField
          label="Subtítulo"
          name="promoSubtitle"
          defaultValue={current.promoSubtitle}
          disabled={isPending}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Texto del botón CTA" name="promoCtaText" defaultValue={current.promoCtaText} disabled={isPending} />
          <Field label="Enlace del botón CTA" name="promoCtaHref" defaultValue={current.promoCtaHref} disabled={isPending} />
        </div>
      </section>

      {/* ── Contacto ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b border-[var(--color-border)] pb-2">
          Contacto
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="WhatsApp (solo números, sin +)"
            name="whatsapp"
            defaultValue={current.whatsapp}
            disabled={isPending}
            placeholder="584241234567"
          />
          <Field
            label="Instagram"
            name="instagram"
            defaultValue={current.instagram}
            disabled={isPending}
            placeholder="@zoe.valencia"
          />
        </div>
      </section>

      {/* ── Navegación ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b border-[var(--color-border)] pb-2">
          Navegación (máx. 6 enlaces)
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)] -mt-2">
          Estos enlaces aparecen en el menú principal del header y en el menú mobile.
        </p>

        <div className="flex flex-col gap-3">
          {Array.from({ length: rowCount }).map((_, i) => {
            const existing = current.navLinks[i];
            return (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor={`navLabel_${i}`}>Etiqueta {i + 1}</Label>
                  <Input
                    id={`navLabel_${i}`}
                    name={`navLabel_${i}`}
                    defaultValue={existing?.label ?? ""}
                    disabled={isPending}
                    placeholder="Inicio"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor={`navHref_${i}`}>Enlace {i + 1}</Label>
                  <Input
                    id={`navHref_${i}`}
                    name={`navHref_${i}`}
                    defaultValue={existing?.href ?? ""}
                    disabled={isPending}
                    placeholder="/"
                  />
                </div>
                {rowCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setRowCount((c) => c - 1)}
                    disabled={isPending}
                    className="mb-0.5 h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  >
                    Quitar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {rowCount < 6 && (
          <button
            type="button"
            onClick={() => setRowCount((c) => c + 1)}
            disabled={isPending}
            className="self-start text-sm font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            + Agregar enlace
          </button>
        )}
      </section>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Guardando…" : "Guardar contenido"}
        </Button>
        {state.error ? (
          <p className="text-sm text-[var(--color-error)]">{state.error}</p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        rows={3}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      />
    </div>
  );
}
