import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { BannerForm } from "@/components/admin/banner-form";
import { ToggleActive } from "@/components/admin/toggle-active";
import { toggleBannerActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: banners } = await supabase
    .from("banners")
    .select("id, name, position, headline, priority, active")
    .order("priority", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Banners</h1>
      <BannerForm />

      <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {(banners ?? []).map((banner) => (
          <li
            key={banner.id}
            className="flex items-center justify-between gap-4 p-3 text-sm"
          >
            <div>
              <p className="font-medium">{banner.name}</p>
              <p className="text-[var(--color-muted-foreground)]">
                {banner.position} · prioridad {banner.priority}
                {banner.headline ? ` · "${banner.headline}"` : ""}
              </p>
            </div>
            <ToggleActive
              id={banner.id}
              active={banner.active}
              action={toggleBannerActive}
            />
          </li>
        ))}
        {(banners ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay banners configurados.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
