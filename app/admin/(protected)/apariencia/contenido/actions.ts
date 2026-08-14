"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import type { SiteContent, NavLink } from "@/lib/domain/site-content-types";
import type { Json } from "@/lib/db/supabase/types";

export interface ContentFormState {
  error: string | null;
}

const HREF_RE = /^(\/|https?:\/\/)/;
const navLinkSchema = z.object({
  label: z.string().min(1).max(30),
  href: z.string().regex(HREF_RE, "El enlace debe comenzar con / o https://"),
});

export async function saveSiteContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireAdminUser(["super_admin", "admin"]);

  // Parse nav links (up to 6 rows: navLabel_0..navLabel_5, navHref_0..navHref_5)
  const navLinks: NavLink[] = [];
  for (let i = 0; i < 6; i++) {
    const label = String(formData.get(`navLabel_${i}`) ?? "").trim();
    const href = String(formData.get(`navHref_${i}`) ?? "").trim();
    if (!label) break;
    const parsed = navLinkSchema.safeParse({ label, href });
    if (!parsed.success) {
      return { error: `Enlace ${i + 1}: ${parsed.error.issues[0]?.message ?? "Datos inválidos"}` };
    }
    navLinks.push(parsed.data);
  }
  if (navLinks.length === 0) {
    return { error: "Debe haber al menos 1 enlace de navegación." };
  }

  const content: SiteContent = {
    heroLabel: String(formData.get("heroLabel") ?? "").trim(),
    heroTitle: String(formData.get("heroTitle") ?? "").trim(),
    heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim(),
    heroCtaText: String(formData.get("heroCtaText") ?? "").trim(),
    heroCtaHref: String(formData.get("heroCtaHref") ?? "").trim(),
    catalogLabel: String(formData.get("catalogLabel") ?? "").trim(),
    promoLabel: String(formData.get("promoLabel") ?? "").trim(),
    promoTitle: String(formData.get("promoTitle") ?? "").trim(),
    promoSubtitle: String(formData.get("promoSubtitle") ?? "").trim(),
    promoCtaText: String(formData.get("promoCtaText") ?? "").trim(),
    promoCtaHref: String(formData.get("promoCtaHref") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "")
      .trim()
      .replace(/^\+/, ""),
    instagram: String(formData.get("instagram") ?? "").trim(),
    navLinks,
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("company_settings")
    .upsert({ key: "site_content", value: content as unknown as Json });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/catalogo");
  revalidatePath("/admin/apariencia/contenido");
  return { error: null };
}
