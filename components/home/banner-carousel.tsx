"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerView } from "@/lib/domain/home";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1400&q=80&auto=format&fit=crop";

export function BannerCarousel({ banners }: { banners: BannerView[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  if (!banner) return null;

  const desktopSrc = banner.imageDesktopUrl ?? FALLBACK_IMAGE;
  const mobileSrc = banner.imageMobileUrl ?? banner.imageDesktopUrl ?? FALLBACK_IMAGE;
  const hasText = !!(banner.headline || banner.copy || banner.ctaLabel);

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)]">

      {/* ── Desktop ── */}
      <div className="relative hidden aspect-[21/9] w-full sm:block">
        <Image
          src={desktopSrc}
          alt={banner.headline ?? banner.name}
          fill
          className="object-cover object-center"
          priority
        />
        {/* dark vignette bottom-up */}
        {hasText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        )}
        {hasText && (
          <div className="absolute bottom-8 left-8 right-8 flex max-w-lg flex-col gap-3 xl:bottom-12 xl:left-12">
            {banner.headline && (
              <h2 className="font-display text-3xl font-bold leading-tight text-white drop-shadow-lg lg:text-4xl xl:text-5xl">
                {banner.headline}
              </h2>
            )}
            {banner.copy && (
              <p className="text-sm leading-relaxed text-white/90 drop-shadow lg:text-base">
                {banner.copy}
              </p>
            )}
            {banner.ctaLabel && banner.ctaUrl && (
              <Link
                href={banner.ctaUrl}
                className="mt-1 self-start inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#29252A] shadow-lg hover:bg-[#F0D8E8] transition-colors"
              >
                {banner.ctaLabel}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile ── */}
      <div className="relative aspect-[4/5] w-full sm:hidden">
        <Image
          src={mobileSrc}
          alt={banner.headline ?? banner.name}
          fill
          className="object-cover object-center"
          priority
        />
        {hasText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        )}
        {hasText && (
          <div className="absolute bottom-7 left-5 right-5 flex flex-col gap-2.5">
            {banner.headline && (
              <h2 className="font-display text-2xl font-bold leading-tight text-white drop-shadow-lg">
                {banner.headline}
              </h2>
            )}
            {banner.copy && (
              <p className="text-sm leading-relaxed text-white/85 drop-shadow">
                {banner.copy}
              </p>
            )}
            {banner.ctaLabel && banner.ctaUrl && (
              <Link
                href={banner.ctaUrl}
                className="mt-1 self-start inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#29252A] shadow-lg hover:bg-[#F0D8E8] transition-colors"
              >
                {banner.ctaLabel}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation arrows ── */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-6 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-6" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
