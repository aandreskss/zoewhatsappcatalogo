import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getLPConfig } from "@/lib/lps"
import { PromoLP } from "@/components/lp/promo-lp"

export const revalidate = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const config = getLPConfig(slug)
  if (!config) return {}
  return {
    title: `${config.headline} ${config.accentText} — Zoe Shop`,
    description: config.subheadline,
    robots: { index: false, follow: false },
  }
}

export default async function LPPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const config = getLPConfig(slug)
  if (!config) notFound()
  return <PromoLP config={config} />
}
