"use client"

import { useEffect, useState } from "react"

interface Props {
  deadline: string // ISO string
  compact?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculate(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, expired: false }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function LPCountdown({ deadline, compact = false }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => calculate(deadline))

  useEffect(() => {
    const id = setInterval(() => setTime(calculate(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (time.expired) {
    return compact ? (
      <span className="font-bold text-[#E8C96E]">¡Oferta terminada!</span>
    ) : (
      <p className="text-xl font-bold text-[#E8C96E]">¡Oferta terminada!</p>
    )
  }

  if (compact) {
    return (
      <span className="font-mono font-bold text-[#E8C96E]">
        {time.days}d {pad(time.hours)}h {pad(time.minutes)}m {pad(time.seconds)}s
      </span>
    )
  }

  return (
    <div className="flex gap-3">
      {[
        { value: time.days, label: "Días" },
        { value: time.hours, label: "Horas" },
        { value: time.minutes, label: "Min" },
        { value: time.seconds, label: "Seg" },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <div className="bg-[#7B1847]/40 border border-[#7B1847]/60 rounded-xl px-4 py-2.5 min-w-[62px] text-center">
            <span className="font-mono text-3xl font-black text-white tabular-nums leading-none">
              {pad(value)}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8A0AE]">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
