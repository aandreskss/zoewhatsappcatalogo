import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { NewProductForm } from "@/components/admin/new-product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <NewProductForm brands={brands ?? []} categories={categories ?? []} />
    </div>
  );
}
