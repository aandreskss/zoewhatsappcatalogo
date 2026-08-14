import { ProductGridSkeleton } from "@/components/ui/skeleton";

/** `loading.tsx` de Next.js — se muestra automáticamente durante la navegación/streaming mientras `page.tsx` resuelve sus datos (sección 28/29 del plan: Skeletons). */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-7 w-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]" />
      <ProductGridSkeleton />
    </main>
  );
}
