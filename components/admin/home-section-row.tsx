"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  toggleHomeSectionActive,
  deleteHomeSection,
  moveHomeSection,
} from "@/app/admin/(protected)/marketing/home/actions";
import { ToggleActive } from "@/components/admin/toggle-active";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function HomeSectionRow({
  id,
  type,
  title,
  active,
}: {
  id: string;
  type: string;
  title: string | null;
  active: boolean;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
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

  return (
    <li className="flex items-center justify-between gap-4 p-3 text-sm">
      <div>
        <p className="font-medium">{type}</p>
        {title ? <p className="text-[var(--color-muted-foreground)]">{title}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => move("up")}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => move("down")}
          >
            ↓
          </Button>
        </div>
        <ToggleActive id={id} active={active} action={toggleHomeSectionActive} />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar
        </Button>
      </div>

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
