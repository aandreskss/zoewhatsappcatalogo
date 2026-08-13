import type { Metadata } from "next";

/**
 * Layout raíz de TODO `/admin/*` (incluye `/admin/login`).
 *
 * Solo se encarga de que nada bajo `/admin` sea indexable (regla
 * permanente: admin nunca indexable), incluso si `next.config.ts` o el
 * middleware fallaran en poner el header `X-Robots-Tag`. La comprobación de
 * sesión/rol vive en `app/admin/(protected)/layout.tsx`, no aquí, para que
 * `/admin/login` no quede atrapado en un redirect infinito.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--color-muted)]">{children}</div>;
}
