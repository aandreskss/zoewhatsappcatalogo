"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerView } from "@/lib/domain/home";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&auto=format&fit=crop";

export function BannerCarousel({ banners }: { banners: BannerView[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, next]);

  if (banners.length === 0) return null;
  const banner = banners[current];
  if (!banner) return null;

  const imageSrc = banner.imageDesktopUrl ?? FALLBACK_IMAGE;
  const imageMobileSrc = banner.imageMobileUrl ?? banner.imageDesktopUrl ?? FALLBACK_IMAGE;

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)]">

      {/* ── Layout principal ── */}
      <div className="flex flex-col sm:flex-row sm:min-h-[340px] md:min-h-[400px]">

        {/* Panel de texto (izquierda en desktop, arriba en móvil) */}
        <div
          className="flex flex-col justify-center gap-4 px-8 py-10 sm:w-[42%] md:px-12 md:py-14"
          style={{ background: "linear-gradient(135deg, #7B1847 0%, #A0325E 100%)" }}
        >
          {banner.headline && (
            <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl xl:text-5xl">
              {banner.headline}
            </h2>
          )}
          {banner.copy && (
            <p className="text-sm leading-relaxed text-white/80 md:text-base max-w-xs">
              {banner.copy}
            </p>
          )}
          {banner.ctaLabel && banner.ctaUrl && (
            <Link
              href={banner.ctaUrl}
              className="mt-2 self-start inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#7B1847] shadow-md hover:bg-[#F0D8E8] transition-colors"
            >
              {banner.ctaLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Imagen (derecha en desktop, abajo en móvil) */}
        <div className="relative flex-1 min-h-[220px] sm:min-h-0">
          {/* Desktop */}
          <div className="absolute inset-0 hidden sm:block">
            <Image
              src={imageSrc}
              alt={banner.headline ?? banner.name}
              fill
              className="object-cover object-top"
              priority
            />
          </div>
          {/* Mobile */}
          <div className="relative h-full min-h-[220px] sm:hidden">
            <Image
              src={imageMobileSrc}
              alt={banner.headline ?? banner.name}
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </div>

      {/* ── Flechas (solo si hay más de 1 banner) ── */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/45 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/45 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-white w-6" : "bg-white/50 w-1.5"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
