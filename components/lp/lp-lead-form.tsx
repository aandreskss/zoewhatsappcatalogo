"use client"

import { useState } from "react"

interface Props {
  whatsappNumber: string
  whatsappMessage: string
  ctaLabel: string
  source: string
  formTitle: string
  formSubtitle: string
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function LPLeadForm({
  whatsappNumber,
  whatsappMessage,
  ctaLabel,
  source,
  formTitle,
  formSubtitle,
}: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
  const firstName = name.split(" ")[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/vip-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), source }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? "Error al guardar tus datos")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="text-6xl animate-bounce">🎉</div>
        <div>
          <h3 className="text-2xl font-black text-white mb-2">
            ¡Listo{firstName ? `, ${firstName}` : ""}!
          </h3>
          <p className="text-[#B8A0AE]">
            Ya estás en nuestra Lista VIP. Te contactamos muy pronto con el catálogo y tu precio especial.
          </p>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors w-full"
        >
          <WhatsAppIcon />
          {ctaLabel}
        </a>
        <p className="text-xs text-[#B8A0AE]">O espera nuestro mensaje — te escribimos pronto 💬</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{formTitle}</h2>
        <p className="text-[#B8A0AE] text-sm leading-relaxed">{formSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Tu nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-[#7B1847] focus:ring-2 focus:ring-[#7B1847]/40 transition text-base"
        />
        <input
          type="tel"
          placeholder="Tu número de WhatsApp (ej: 0424-1234567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-[#7B1847] focus:ring-2 focus:ring-[#7B1847]/40 transition text-base"
        />

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E8C96E] hover:bg-[#D4A857] disabled:opacity-50 disabled:cursor-not-allowed text-[#0D0408] font-black text-lg py-4 rounded-2xl transition-colors"
        >
          {loading ? "Guardando..." : "Quiero mis precios VIP →"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[#B8A0AE]">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-xs shrink-0">o contáctanos directo</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-6 py-4 rounded-2xl font-bold text-base transition-colors"
      >
        <WhatsAppIcon />
        {ctaLabel}
      </a>

      <p className="text-center text-xs text-[#B8A0AE]">
        🔒 Sin spam. Solo te contactamos para enviarte los precios especiales.
      </p>
    </div>
  )
}
