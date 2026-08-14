"use client";

import { useTransition } from "react";
import { assignTag, removeTag } from "@/app/admin/(protected)/clientes/actions";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Props {
  customerId: string;
  allTags: Tag[];
  assignedTagIds: string[];
}

export function CustomerTagsEditor({ customerId, allTags, assignedTagIds }: Props) {
  const [isPending, startTransition] = useTransition();
  const assignedSet = new Set(assignedTagIds);

  function toggle(tagId: string) {
    startTransition(async () => {
      if (assignedSet.has(tagId)) {
        await removeTag(customerId, tagId);
      } else {
        await assignTag(customerId, tagId);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const active = assignedSet.has(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            disabled={isPending}
            title={active ? "Quitar etiqueta" : "Asignar etiqueta"}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50"
            style={{
              borderColor: tag.color,
              backgroundColor: active ? tag.color + "22" : "transparent",
              color: tag.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            {active ? " ×" : " +"}
          </button>
        );
      })}
      {allTags.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No hay etiquetas creadas todavía.
        </p>
      ) : null}
    </div>
  );
}
