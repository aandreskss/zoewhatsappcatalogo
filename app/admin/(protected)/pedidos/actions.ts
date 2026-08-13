"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { requireAdminUser } from "@/lib/auth/session";

const ORDER_STATUSES = [
  "nuevo",
  "enviado_whatsapp",
  "contactado",
  "confirmado",
  "esperando_pago",
  "pagado",
  "preparando",
  "listo_para_entregar",
  "enviado",
  "entregado",
  "cancelado",
] as const;

const statusSchema = z.enum(ORDER_STATUSES);

export async function changeOrderStatus(
  orderId: string,
  nextStatus: string,
  note?: string,
): Promise<void> {
  const admin = await requireAdminUser(["super_admin", "admin", "sales"]);
  const parsedStatus = statusSchema.parse(nextStatus);

  const supabase = await createSupabaseServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (orderError) throw orderError;

  const previousStatus = order.status;
  if (previousStatus === parsedStatus) return;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: parsedStatus })
    .eq("id", orderId);
  if (updateError) throw updateError;

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: previousStatus,
    to_status: parsedStatus,
    changed_by: admin.id,
    note: note ?? null,
  });
  if (historyError) throw historyError;

  // Confirmar por primera vez convierte la reserva temporal en salida
  // definitiva de inventario (sección 14/18 del plan). Se comprueba el
  // historial para no volver a descontar si el admin alterna estados.
  if (parsedStatus === "confirmado" || parsedStatus === "pagado") {
    const { count } = await supabase
      .from("order_status_history")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .in("to_status", ["confirmado", "pagado"])
      .lt("created_at", new Date().toISOString());

    // count incluye la fila recién insertada; si es la única, es la primera confirmación.
    if ((count ?? 0) <= 1) {
      const { error: rpcError } = await supabase.rpc("confirm_order_inventory", {
        p_order_id: orderId,
        p_user_id: admin.id,
      });
      if (rpcError) throw rpcError;
    }
  }

  if (parsedStatus === "cancelado") {
    const { error: rpcError } = await supabase.rpc("release_order_reservations", {
      p_order_id: orderId,
    });
    if (rpcError) throw rpcError;
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

const noteSchema = z.string().trim().min(1, "La nota no puede estar vacía").max(1000);

export interface FormState {
  error: string | null;
}

export async function addOrderNote(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdminUser(["super_admin", "admin", "sales"]);
  const parsed = noteSchema.safeParse(formData.get("note"));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Nota inválida" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("order_notes")
    .insert({ order_id: orderId, user_id: admin.id, note: parsed.data });
  if (error) return { error: error.message };

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { error: null };
}
