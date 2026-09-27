import Image from "next/image"
import type { LPConfig } from "@/lib/lps"
import { LPCountdown } from "./lp-countdown"
import { LPLeadForm } from "./lp-lead-form"

interface Props {
  config: LPConfig
}

const SHOE_IMAGES = [
  "/lp/promo50/gjm7qks77baoechfuvw4.jpg",
  "/lp/promo50/gog9q9f95vnlg9eeaxec.jpg",
  "/lp/promo50/gukzpny8it4v8ogwwchl.jpg",
  "/lp/promo50/hwvmy8fccuu9fjzbppzo.jpg",
  "/lp/promo50/iaj7anq46zo0ranxsize.jpg",
  "/lp/promo50/j9zteykeabrwaclzadqo.jpg",
  "/lp/promo50/jecy8qqsomqzu0ik8atg.jpg",
  "/lp/promo50/jgmi9ewcdjy0qfqohdgn.jpg",
  "/lp/promo50/jgmi9ewcdjy0qfqohdgn1.jpg",
  "/lp/promo50/jtnlyfpipiugmgosmnx7.jpg",
  "/lp/promo50/jzj3wkn34jurygsd2lzk.jpg",
  "/lp/promo50/kaignqm2mhff1hz1imjt.jpg",
  "/lp/promo50/lag3y2jrrdxxwgjnh5nk.jpg",
  "/lp/promo50/min6nfmc35g5zygco18r.jpg",
  "/lp/promo50/mqx6pyqzfcfdgwa3zaid.jpg",
  "/lp/promo50/pekilqmei9pijgotoytu.jpg",
  "/lp/promo50/qjvlxezmjcjiigbilgnc.jpg",
  "/lp/promo50/swtxitit2w4w8r7dvmxt.jpg",
  "/lp/promo50/u4jp0e048io2sq8ixw8s.jpg",
  "/lp/promo50/uilbcwoamgjlpmflogwg.jpg",
  "/lp/promo50/vkoyunetvw2coijnx84h.jpg",
  "/lp/promo50/vvjc1tmoi7qeisxub2e1.jpg",
  "/lp/promo50/vzfpxrxi8vo2iitwft7g.jpg",
  "/lp/promo50/xvzrrsu4obw3qe3is6zg.jpg",
  "/lp/promo50/z6ie3wkj1kuv0tvudnxt.jpg",
  "/lp/promo50/a57tkn7ztl9tsarj2qz5.jpg",
  "/lp/promo50/bnlnwhwijzwu5mbmcyh1.jpg",
  "/lp/promo50/bsfdi0cgfvmhax1g9pai.jpg",
  "/lp/promo50/emp9it3sxdf8psvoejcr.jpg",
  "/lp/promo50/enuvlfbluxqztz0lwx5w.jpg",
  "/lp/promo50/fk3ny4rwdu6fukldk9zh.jpg",
  "/lp/promo50/fnonxu9gzvwikn92qfq4.jpg",
  "/lp/promo50/fyrnmk2wom3jyz3i5xjr.jpg",
] as const

const hero0 = SHOE_IMAGES[0] as string
const hero1 = SHOE_IMAGES[1] as string
const hero2 = SHOE_IMAGES[2] as string

function WhatsAppIcon({ size = 6 }: { size?: number }) {
  return (
    <svg className={`w-${size} h-${size} shrink-0`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function PromoLP({ config }: Props) {
  const deadlineISO = config.deadline.toISOString()

  return (
    <div className="bg-[#0D0408] min-h-screen text-white overflow-x-hidden pb-20 md:pb-0">

      {/* ── Urgency bar (fixed) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#7B1847] py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <span className="animate-pulse">⚡</span>
        <span className="hidden sm:inline">La oferta termina en:</span>
        <LPCountdown deadline={deadlineISO} compact />
        <span className="hidden sm:inline">· ¡No la dejes pasar!</span>
      </div>

      {/* ── Hero ── */}
      <section className="flex items-center pt-16 pb-12 md:pt-24 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-20 items-center w-full">

          {/* Left: copy */}
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-[#7B1847]/30 border border-[#7B1847]/50 rounded-full px-4 py-1.5 text-sm text-[#F0D8E8] mb-4 md:mb-6 font-medium">
              {config.badgeText}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-4 md:mb-5">
              {config.headline}
              <br />
              <span className="text-[#F0B8D0]">{config.accentText}</span>
            </h1>

            <p className="text-base md:text-lg text-[#B8A0AE] mb-6 md:mb-10 max-w-md leading-relaxed">
              {config.subheadline}
            </p>

            <div className="mb-6 md:mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#B8A0AE] mb-3">
                La oferta termina en:
              </p>
              <LPCountdown deadline={deadlineISO} />
            </div>

            <a
              href="#formulario"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black text-lg md:text-xl px-8 md:px-10 py-4 md:py-5 rounded-full transition-colors shadow-lg shadow-[#25D366]/25 sm:inline-flex sm:w-auto w-full"
            >
              <WhatsAppIcon size={6} />
              {config.ctaLabel}
            </a>
          </div>

          {/* Mobile: single hero image */}
          <div className="order-1 md:hidden relative rounded-2xl overflow-hidden" style={{ height: "260px" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
            <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
              -{config.discountPercent}%
            </div>
            <Image src={hero0} alt="Tacón Zoe Shop" fill className="object-cover object-top" sizes="100vw" priority />
          </div>

          {/* Desktop: 3-image collage */}
          <div
            className="order-1 md:order-2 hidden md:grid grid-cols-2"
            style={{ gridTemplateRows: "240px 240px", gap: "12px" }}
          >
            <div className="relative rounded-2xl overflow-hidden" style={{ gridRow: "1 / 3" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image src={hero0} alt="Tacón Zoe Shop" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" priority />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image src={hero1} alt="Tacón Zoe Shop" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" priority />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/50 to-transparent z-10" />
              <div className="absolute top-3 right-3 z-20 bg-[#7B1847] text-white text-xs font-black px-2.5 py-1 rounded-full">
                -{config.discountPercent}%
              </div>
              <Image src={hero2} alt="Tacón Zoe Shop" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" priority />
            </div>
          </div>
        </div>
      </section>

      {/* ── Product grid ── */}
      <section className="py-16 md:py-20 px-4 bg-[#160810]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-[#F0B8D0] text-xs font-bold uppercase tracking-widest mb-3">
              Nuestra colección
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black">
              Estos son algunos de los estilos
            </h2>
            <p className="text-[#B8A0AE] mt-3">
              Todos al {config.discountPercent}% de descuento — solo por tiempo limitado
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
            {SHOE_IMAGES.map((src, i) => (
              <a key={i} href="#formulario" className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl group block">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0408]/75 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 z-20 bg-[#7B1847] text-white text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-full">
                  -{config.discountPercent}%
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-2 md:p-3 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  <span className="block w-full text-center bg-[#25D366] text-white text-[10px] sm:text-xs font-black py-1.5 md:py-2 rounded-full">
                    Quiero este precio →
                  </span>
                </div>
                <Image
                  src={src}
                  alt="Tacón Zoe Shop"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </a>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <a
              href="#formulario"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black px-8 md:px-10 py-4 md:py-5 rounded-full transition-colors text-base md:text-lg shadow-lg shadow-[#25D366]/25 sm:inline-flex sm:w-auto w-full"
            >
              <WhatsAppIcon size={6} />
              {config.ctaLabel}
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="py-10 md:py-14 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
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

      {/* ── Social proof ── */}
      <section className="py-10 px-4 bg-[#160810]">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="text-[#F0B8D0] text-xl">★★★★★</div>
          <p className="text-white font-bold text-base md:text-lg italic">
            "Increíble calidad y el precio más bajo que encontré. Los tacones son espectaculares."
          </p>
          <p className="text-[#B8A0AE] text-sm">— Cliente satisfecha · Valencia, Carabobo</p>
        </div>
      </section>

      {/* ── Lead capture ── */}
      <section id="formulario" className="py-16 md:py-24 px-4">
        <div className="max-w-md mx-auto">
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
        <a href="/catalogo" className="text-[#F0B8D0] hover:underline mt-4 inline-block text-sm">
          Ver catálogo completo →
        </a>
      </footer>

      {/* ── Sticky mobile CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0408]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <a
          href="#formulario"
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black text-base py-3.5 rounded-2xl transition-colors w-full shadow-lg shadow-[#25D366]/20"
        >
          <WhatsAppIcon size={5} />
          ¡Pide tu 50% ahora! 👠
        </a>
      </div>
    </div>
  )
}
