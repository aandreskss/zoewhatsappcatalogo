"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BannerView } from "@/lib/domain/home";

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

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
      <div className="relative">
        {/* Desktop image */}
        {banner.imageDesktopUrl && (
          <div className="relative hidden aspect-[21/9] w-full sm:block">
            <Image
              src={banner.imageDesktopUrl}
              alt={banner.headline ?? banner.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Mobile image */}
        {(banner.imageMobileUrl || banner.imageDesktopUrl) && (
          <div className="relative aspect-[4/5] w-full sm:hidden">
            <Image
              src={banner.imageMobileUrl ?? banner.imageDesktopUrl!}
              alt={banner.headline ?? banner.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Banner anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                  className={`size-2 rounded-full transition-colors ${
                    i === current ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Text + CTA */}
      {(banner.headline || banner.ctaLabel) && (
        <div className="flex flex-col items-start gap-2 p-6">
          {banner.headline && (
            <h2 className="text-xl font-semibold">{banner.headline}</h2>
          )}
          {banner.copy && (
            <p className="text-[var(--color-muted-foreground)]">{banner.copy}</p>
          )}
          {banner.ctaLabel && banner.ctaUrl && (
            <Button asChild size="sm">
              <Link href={banner.ctaUrl}>{banner.ctaLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
