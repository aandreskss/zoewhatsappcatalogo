"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  toggleHomeSectionActive,
  deleteHomeSection,
  moveHomeSection,
} from "@/app/admin/(protected)/marketing/home/actions";
import { ToggleActive } from "@/components/admin/toggle-active";
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
  const router = useRouter();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveHomeSection(id, direction);
      router.refresh();
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
          onClick={() => {
            startTransition(async () => {
              await deleteHomeSection(id);
              router.refresh();
            });
          }}
        >
          Eliminar
        </Button>
      </div>
    </li>
  );
}
