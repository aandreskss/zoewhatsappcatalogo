import Image from "next/image"
import type { ProductListItem } from "@/lib/domain/catalog-types"
import type { LPConfig } from "@/lib/lps"
import { LPCountdown } from "./lp-countdown"
import { LPLeadForm } from "./lp-lead-form"

interface Props {
  config: LPConfig
  products: ProductListItem[]
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
]

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function PromoLP({ config, products }: Props) {
  const waUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`
  const deadlineISO = config.deadline.toISOString()

  // Build image list — fill with fallbacks if needed
  const allImages: { url: string; name: string }[] = products
    .filter((p) => p.primaryImageUrl)
    .map((p) => ({ url: p.primaryImageUrl!, name: p.name }))

  while (allImages.length < 8) {
    const fb = FALLBACK_IMAGES[allImages.length % FALLBACK_IMAGES.length] ?? FALLBACK_IMAGES[0]!
    allImages.push({ url: fb, name: "Tacón Zoe" })
  }

  const [hero0, hero1, hero2] = allImages as [
    { url: string; name: string },
    { url: string; name: string },
    { url: string; name: string },
    ...{ url: string; name: string }[],
  ]
  const gridImages = allImages.slice(0, 12)

  return (
    <div className="bg-[#0D0408] min-h-screen text-white overflow-x-hidden">

      {/* ── Urgency bar (fixed) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#7B1847] py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <span className="animate-pulse">⚡</span>
        <span className="hidden sm:inline">La oferta termina en:</span>
        <LPCountdown deadline={deadlineISO} compact />
        <span className="hidden sm:inline">· ¡No la dejes pasar!</span>
      </div>

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* Left: copy */}
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-[#7B1847]/30 border border-[#7B1847]/50 rounded-full px-4 py-1.5 text-sm text-[#E8C96E] mb-6 font-medium">
              {config.badgeText}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-5">
              {config.headline}
              <br />
              <span className="text-[#E8C96E]">{config.accentText}</span>
            </h1>

            <p className="text-lg text-[#B8A0AE] mb-10 max-w-md leading-relaxed">
              {config.subheadline}
            </p>

            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#B8A0AE] mb-3">
                La oferta termina en:
              </p>
              <LPCountdown deadline={deadlineISO} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#formulario"
                className="bg-[#E8C96E] hover:bg-[#D4A857] text-[#0D0408] font-black text-lg px-8 py-4 rounded-full transition-colors text-center"
              >
                Quiero mi descuento →
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-lg px-8 py-4 rounded-full transition-colors"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Right: image collage — 1 tall left + 2 stacked right */}
          <div className="order-1 md:order-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "240px 240px", gap: "12px" }}>
            <div className="relative rounded-2xl overflow-hidden" style={{ gridRow: "1 / 3" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/60 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image
                src={hero0.url}
                alt={hero0.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image
                src={hero1.url}
                alt={hero1.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image
                src={hero2.url}
                alt={hero2.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Product grid ── */}
      <section className="py-20 px-4 bg-[#160810]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#E8C96E] text-xs font-bold uppercase tracking-widest mb-3">
              Nuestra colección
            </p>
            <h2 className="text-3xl md:text-4xl font-black">
              Estos son algunos de los estilos
            </h2>
            <p className="text-[#B8A0AE] mt-3">
              Todos al {config.discountPercent}% de descuento — solo por tiempo limitado
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {gridImages.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/70 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 z-20 bg-[#7B1847] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  -{config.discountPercent}%
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a
                    href="#formulario"
                    className="block w-full text-center bg-[#E8C96E] text-[#0D0408] text-xs font-black py-2 rounded-full"
                  >
                    Quiero este precio
                  </a>
                </div>
                <Image
                  src={img.url}
                  alt={img.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="#formulario"
              className="inline-flex items-center gap-2 bg-[#7B1847] hover:bg-[#A0325E] text-white font-bold px-8 py-4 rounded-full transition-colors text-lg"
            >
              ¡Quiero acceder a la promo! →
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="py-14 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: "🏆", title: "20 años", subtitle: "de trayectoria" },
            { icon: "✈️", title: "Importado", subtitle: "calidad premium" },
            { icon: "💬", title: "Atención", subtitle: "personalizada" },
            { icon: "🏬", title: "2 sedes", subtitle: "en Valencia" },
          ].map((badge) => (
            <div key={badge.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{badge.icon}</span>
              <div>
                <p className="font-black text-white">{badge.title}</p>
                <p className="text-sm text-[#B8A0AE]">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="py-10 px-4 bg-[#160810]">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-1 text-[#E8C96E] text-xl">
            {"★★★★★"}
          </div>
          <p className="text-white font-bold text-lg italic">
            "Increíble calidad y el precio más bajo que encontré. Los tacones son espectaculares."
          </p>
          <p className="text-[#B8A0AE] text-sm">— Cliente satisfecha · Valencia, Carabobo</p>
        </div>
      </section>

      {/* ── Lead capture ── */}
      <section id="formulario" className="py-24 px-4">
        <div className="max-w-md mx-auto">
          {/* Urgency reminder */}
          <div className="bg-[#7B1847]/20 border border-[#7B1847]/40 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3">
            <span className="text-2xl shrink-0">⏰</span>
            <div>
              <p className="font-bold text-white text-sm">¡Quedan pocos días!</p>
              <p className="text-[#B8A0AE] text-xs">
                Esta promo del {config.discountPercent}% no se repite. Regístrate ahora.
              </p>
            </div>
          </div>

          <LPLeadForm
            whatsappNumber={config.whatsappNumber}
            whatsappMessage={config.whatsappMessage}
            ctaLabel={config.ctaLabel}
            source={config.source}
            formTitle={config.formTitle}
            formSubtitle={config.formSubtitle}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 border-t border-white/5 text-center">
        <p className="font-black text-white text-xl mb-1">ZOE Shop</p>
        <p className="text-[#B8A0AE] text-sm">Valencia, Carabobo · 20 años vistiendo tus pasos</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <a href="/catalogo" className="text-[#E8C96E] hover:underline">
            Ver catálogo completo →
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] hover:underline flex items-center gap-1"
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        </div>
      </footer>
    </div>
  )
}
