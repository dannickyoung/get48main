"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { todaySGTString } from "@/lib/time";

async function assertAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("Not authorised");
}

// ---------------------------------------------------------------------------
// First-login password change (done server-side via the admin API — reliable,
// avoids the browser auth-client hang).
// ---------------------------------------------------------------------------
export async function setInitialPassword(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login/admin");

  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...(user.user_metadata ?? {}), must_change_password: false },
  });
  if (error) return { error: error.message };

  redirect("/admin");
}

/** Change password from Settings (already-authenticated admin). */
export async function changePassword(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  await assertAdmin();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login/admin");

  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...(user.user_metadata ?? {}), must_change_password: false },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

function str(fd: FormData, key: string): string {
  return (fd.get(key)?.toString() ?? "").trim();
}
function numOr(fd: FormData, key: string, fallback: number): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : fallback;
}

// ---------------------------------------------------------------------------
// Clients + retainers
// ---------------------------------------------------------------------------
export async function addClient(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();

  const email = str(formData, "email").toLowerCase();
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: str(formData, "name"),
      email,
      company: str(formData, "company") || null,
      notes: str(formData, "notes") || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: rErr } = await supabase.from("retainers").insert({
    client_id: client.id,
    start_date: str(formData, "start_date"),
    videos_per_month: numOr(formData, "videos_per_month", 4),
    monthly_price: numOr(formData, "monthly_price", 0),
    overage_rate: numOr(formData, "overage_rate", 0),
    rollover_cap: numOr(formData, "rollover_cap", 5),
    rollover_weeks: numOr(formData, "rollover_weeks", 8),
    status: "active",
  });
  if (rErr) throw new Error(rErr.message);

  // Best-effort: pre-create the auth user so the client can request a magic link.
  try {
    const admin = createAdminClient();
    await admin.auth.admin.inviteUserByEmail(email);
  } catch {
    /* inviting is optional; client can self-request a link from /login */
  }

  revalidatePath("/admin");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: str(formData, "name"),
      email: str(formData, "email").toLowerCase(),
      company: str(formData, "company") || null,
      notes: str(formData, "notes") || null,
    })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

/** Override one billing month's videos/price (blank field = use retainer default). */
export async function setMonthTerms(clientId: string, periodIndex: number, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const vRaw = str(formData, "videos_per_month");
  const pRaw = str(formData, "monthly_price");
  const videos_per_month = vRaw === "" ? null : Math.max(0, Number(vRaw));
  const monthly_price = pRaw === "" ? null : Math.max(0, Number(pRaw));

  if (videos_per_month === null && monthly_price === null) {
    await supabase.from("retainer_months").delete().eq("client_id", clientId).eq("period_index", periodIndex);
  } else {
    const { error } = await supabase
      .from("retainer_months")
      .upsert(
        { client_id: clientId, period_index: periodIndex, videos_per_month, monthly_price },
        { onConflict: "client_id,period_index" },
      );
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function updateRetainer(clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("retainers")
    .update({
      start_date: str(formData, "start_date"),
      videos_per_month: numOr(formData, "videos_per_month", 4),
      monthly_price: numOr(formData, "monthly_price", 0),
      overage_rate: numOr(formData, "overage_rate", 0),
      rollover_cap: numOr(formData, "rollover_cap", 5),
      rollover_weeks: numOr(formData, "rollover_weeks", 8),
      status: str(formData, "status") || "active",
    })
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

export async function setArchived(clientId: string, archived: boolean) {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("clients").update({ archived }).eq("id", clientId);
  revalidatePath("/admin");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------
export async function logDelivery(clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("videos").insert({
    client_id: clientId,
    delivered_on: str(formData, "delivered_on"),
    quantity: Math.max(1, numOr(formData, "quantity", 1)),
    title: str(formData, "title") || null,
    link: str(formData, "link") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/admin");
}

/** Log a delivery from the cross-client Deliveries page (client picked in the form). */
export async function logDeliveryQuick(formData: FormData) {
  await assertAdmin();
  const clientId = str(formData, "client_id");
  if (!clientId) throw new Error("Pick a client");
  await logDelivery(clientId, formData);
}

export async function updateDelivery(videoId: string, clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({
      delivered_on: str(formData, "delivered_on"),
      quantity: Math.max(1, numOr(formData, "quantity", 1)),
      title: str(formData, "title") || null,
      link: str(formData, "link") || null,
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/deliveries");
  revalidatePath("/admin");
}

export async function deleteDelivery(videoId: string, clientId: string) {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("videos").delete().eq("id", videoId);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/deliveries");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export async function setPayment(input: {
  clientId: string;
  periodIndex: number;
  periodStart: string;
  kind: "deposit" | "balance";
  amount: number;
  paid: boolean;
}) {
  await assertAdmin();
  const supabase = await createClient();
  const today = todaySGTString();
  const { error } = await supabase
    .from("payments")
    .upsert(
      {
        client_id: input.clientId,
        period_index: input.periodIndex,
        period_start: input.periodStart,
        kind: input.kind,
        amount: input.amount,
        status: input.paid ? "paid" : "pending",
        paid_on: input.paid ? today : null,
      },
      { onConflict: "client_id,period_index,kind" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${input.clientId}`);
  revalidatePath("/admin");
}
