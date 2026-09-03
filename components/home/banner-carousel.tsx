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

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)]">
      {/* Desktop */}
      <div className="relative hidden aspect-[21/9] w-full sm:block">
        <Image
          src={desktopSrc}
          alt={banner.headline ?? banner.name}
          fill
          className="object-cover"
          priority
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <BannerTextOverlay banner={banner} />
      </div>

      {/* Mobile */}
      <div className="relative aspect-[4/5] w-full sm:hidden">
        <Image
          src={mobileSrc}
          alt={banner.headline ?? banner.name}
          fill
          className="object-cover"
          priority
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <BannerTextOverlay banner={banner} mobile />
      </div>

      {/* Arrows */}
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
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
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

function BannerTextOverlay({
  banner,
  mobile,
}: {
  banner: BannerView;
  mobile?: boolean;
}) {
  if (!banner.headline && !banner.ctaLabel) return null;

  return (
    <div
      className={`absolute flex flex-col gap-3 ${
        mobile
          ? "bottom-8 left-5 right-5"
          : "bottom-0 left-0 top-0 w-1/2 justify-center px-10 xl:px-14"
      }`}
    >
      {banner.headline && (
        <h2
          className={`font-display font-semibold text-white leading-tight ${
            mobile ? "text-2xl" : "text-3xl lg:text-4xl xl:text-5xl"
          }`}
        >
          {banner.headline}
        </h2>
      )}
      {banner.copy && (
        <p
          className={`text-white/80 leading-relaxed ${
            mobile ? "text-sm" : "text-sm lg:text-base max-w-xs"
          }`}
        >
          {banner.copy}
        </p>
      )}
      {banner.ctaLabel && banner.ctaUrl && (
        <Link
          href={banner.ctaUrl}
          className="self-start mt-1 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#29252A] hover:bg-[#F0D8E8] transition-colors"
        >
          {banner.ctaLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
