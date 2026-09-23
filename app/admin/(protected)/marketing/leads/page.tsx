import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";
import { LeadsTable } from "./leads-table";

export const metadata = { title: "Lista VIP · Admin" };

export default async function VipLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminUser(["super_admin", "admin", "sales"]);

  const { q } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from("vip_leads")
    .select("id, name, phone, email, source, created_at")
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    query = query.or(
      `name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`,
    );
  }

  const { data: leads } = await query;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#F0D8E8] flex items-center justify-center">
            <span style={{ fontSize: 16 }}>👑</span>
          </div>
          <h1 className="text-2xl font-bold text-[#29252A]">Lista VIP</h1>
        </div>
        <p className="text-sm text-[#29252A]/60 ml-11">
          Personas que se registraron para recibir ofertas y descuentos exclusivos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-[#EBE0E7] bg-white p-5 shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 mb-1">Total registros</p>
          <p className="text-3xl font-bold text-[#7B1847]">{leads?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[#EBE0E7] bg-white p-5 shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 mb-1">Con email</p>
          <p className="text-3xl font-bold text-[#29252A]">
            {leads?.filter((l) => l.email).length ?? 0}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-[#EBE0E7] bg-white p-5 shadow-[0_1px_3px_rgba(41,37,42,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#29252A]/40 mb-1">Esta semana</p>
          <p className="text-3xl font-bold text-[#29252A]">
            {leads?.filter((l) => {
              const d = new Date(l.created_at);
              const now = new Date();
              const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
              return diff <= 7;
            }).length ?? 0}
          </p>
        </div>
      </div>

      <LeadsTable leads={leads ?? []} searchQuery={q ?? ""} />
    </div>
  );
}
