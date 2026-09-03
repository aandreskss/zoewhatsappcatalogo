"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  toggleHomeSectionActive,
  deleteHomeSection,
  moveHomeSection,
  updateHomeSectionConfig,
} from "@/app/admin/(protected)/marketing/home/actions";
import { ToggleActive } from "@/components/admin/toggle-active";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { Json } from "@/lib/db/supabase/types";

export function HomeSectionRow({
  id,
  type,
  title,
  active,
  config,
}: {
  id: string;
  type: string;
  title: string | null;
  active: boolean;
  config: Json;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [configText, setConfigText] = React.useState(
    JSON.stringify(config ?? {}, null, 2),
  );
  const router = useRouter();
  const toast = useToast();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveHomeSection(id, direction);
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteHomeSection(id);
        setConfirmOpen(false);
        toast("Bloque eliminado del Home.", "success");
        router.refresh();
      } catch (err) {
        setConfirmOpen(false);
        toast(
          err instanceof Error ? err.message : "No se pudo eliminar el bloque",
          "error",
        );
      }
    });
  }

  function saveConfig() {
    startTransition(async () => {
      try {
        await updateHomeSectionConfig(id, configText);
        setEditOpen(false);
        toast("Configuración guardada.", "success");
        router.refresh();
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "No se pudo guardar el config",
          "error",
        );
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 p-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{type}</p>
          {title ? <p className="text-[var(--color-muted-foreground)]">{title}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => move("up")}>↑</Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => move("down")}>↓</Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setEditOpen((o) => !o)}
          >
            {editOpen ? "Cerrar" : "Config"}
          </Button>
          <ToggleActive id={id} active={active} action={toggleHomeSectionActive} />
          <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      {editOpen && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            rows={5}
            disabled={isPending}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={saveConfig}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar bloque del Home"
        description={`Esto quita "${title ?? type}" del Home público de inmediato. No se puede deshacer.`}
        confirmLabel="Eliminar"
        isDangerous
        isPending={isPending}
      />
    </li>
  );
}
