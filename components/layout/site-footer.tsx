import Link from "next/link";
import type { SiteContent } from "@/lib/domain/site-content-types";

export function SiteFooter({ content }: { content: SiteContent }) {
  const whatsappNumber = content.whatsapp.replace(/^\+/, "").replace(/\s/g, "");

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <p className="font-display text-3xl text-[var(--color-foreground)] mb-4">Zoe</p>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-xs">
              Encuentra tu talla y arma tu pedido para coordinarlo por WhatsApp. Calzado femenino en Valencia, Venezuela.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[var(--color-primary)] hover:text-[#B8647A] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Escríbenos por WhatsApp
            </a>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-12 md:justify-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-4">Comprar</p>
              <nav className="flex flex-col gap-3">
                <Link href="/catalogo" className="text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors">Todo el catálogo</Link>
                <Link href="/buscar" className="text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors">Buscar</Link>
                <Link href="/carrito" className="text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors">Mi carrito</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-4">Zoe</p>
              <nav className="flex flex-col gap-3">
                <Link href="/tiendas" className="text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors">Nuestras tiendas</Link>
              </nav>
            </div>
          </div>

          {/* Social + Location */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] mb-4">Síguenos</p>
            <a
              href={`https://instagram.com/${content.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors mb-6"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              {content.instagram}
            </a>
            <p className="text-sm text-[var(--color-muted-foreground)]">Valencia, Venezuela</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 py-5">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            © {new Date().getFullYear()} Zoe Shoes · Valencia, Venezuela
          </p>
        </div>
      </div>
    </footer>
  );
}
