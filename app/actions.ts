"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { todaySGTString } from "@/lib/time";
import { toVideoStatus } from "@/lib/video-status";
import { ADDITIONAL_VIDEO_COST_MAX, ADDITIONAL_VIDEO_COST_MIN, isValidAdditionalVideoCost } from "@/lib/retainer/additional";
import { ensureInvoice as ensureInvoiceWith } from "@/lib/invoice/issue";
import { periodIndexForDate } from "@/lib/retainer/periods";
import { accessUntilFor } from "@/lib/retainer/access";
import {
  sendClientWelcome,
  sendRetainerPaused,
  sendRetainerStopped,
  sendRetainerReactivated,
  sendAccountClosed,
} from "@/lib/email";

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

  redirect(`/admin?toast=${encodeURIComponent("Password set")}`);
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
/** Read the payment-terms mode from a form; anything but 'upfront' is 'split'. */
function paymentTerms(fd: FormData): "split" | "upfront" {
  return str(fd, "payment_terms") === "upfront" ? "upfront" : "split";
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
    payment_terms: paymentTerms(formData),
    status: "active",
  });
  if (rErr) throw new Error(rErr.message);

  // Pre-create a confirmed auth user so the client is never "new" at sign-in —
  // that way they always get the OTP-code email (not the signup-confirmation one).
  try {
    const admin = createAdminClient();
    await admin.auth.admin.createUser({ email, email_confirm: true });
  } catch {
    /* user may already exist; they can still request a code from /login/client */
  }

  // Send a friendly welcome email with sign-in instructions (best-effort).
  try {
    await sendClientWelcome({ to: email, name: str(formData, "name") });
  } catch {
    /* welcome email is best-effort; don't block client creation */
  }

  revalidatePath("/admin");
  redirect(`/clients/${client.id}?toast=${encodeURIComponent("Client created")}`);
}

/** Add another person who can sign in and view this client's dashboard. */
export async function addClientMember(clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const email = str(formData, "email").toLowerCase();
  if (!email) throw new Error("Enter an email address");

  const { data: client } = await supabase.from("clients").select("name, email").eq("id", clientId).maybeSingle();
  if (client && email === client.email.toLowerCase()) {
    throw new Error("That's already the primary contact");
  }

  // Insert the membership first so the new-user trigger can resolve their client.
  const { error } = await supabase.from("client_members").insert({ client_id: clientId, email });
  if (error) throw new Error(error.code === "23505" ? "That email already has access" : error.message);

  // Pre-create a confirmed auth user so they get an OTP code (not a signup email).
  try {
    const admin = createAdminClient();
    await admin.auth.admin.createUser({ email, email_confirm: true });
  } catch {
    /* may already exist; they can still request a code from /login/client */
  }
  // Welcome them with the same sign-in instructions (best-effort).
  try {
    await sendClientWelcome({ to: email, name: client?.name ?? "there" });
  } catch {}

  revalidatePath(`/clients/${clientId}`);
}

/** Remove a teammate's access and their login. */
export async function removeClientMember(memberId: string, clientId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data: m } = await supabase.from("client_members").select("email").eq("id", memberId).maybeSingle();

  if (m?.email) {
    try {
      const admin = createAdminClient();
      const { data: prof } = await admin.from("profiles").select("id").ilike("email", m.email).maybeSingle();
      if (prof?.id) await admin.auth.admin.deleteUser(prof.id);
    } catch {}
  }
  await supabase.from("client_members").delete().eq("id", memberId);
  revalidatePath(`/clients/${clientId}`);
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

/**
 * Override one billing month's videos/price (blank field = use retainer default),
 * and set that month's additional videos (quantity + cost per video, $0–$1000).
 * Additional videos raise the month's allotment and are billed quantity × cost
 * on the month-end payment row.
 */
export async function setMonthTerms(clientId: string, periodIndex: number, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const vRaw = str(formData, "videos_per_month");
  const pRaw = str(formData, "monthly_price");
  const oRaw = str(formData, "overage_rate");
  const videos_per_month = vRaw === "" ? null : Math.max(0, Number(vRaw));
  const monthly_price = pRaw === "" ? null : Math.max(0, Number(pRaw));
  const overage_rate = oRaw === "" ? null : Math.max(0, Number(oRaw));

  // Additional videos: whole quantity ≥ 0; cost per video within [0, 1000].
  const aRaw = str(formData, "additional_videos");
  const cRaw = str(formData, "additional_video_cost");
  const additional_videos = aRaw === "" ? 0 : Math.floor(Number(aRaw));
  if (!Number.isFinite(additional_videos) || additional_videos < 0) {
    throw new Error("Additional videos must be 0 or more");
  }
  const additional_video_cost = cRaw === "" ? 0 : Number(cRaw);
  if (!isValidAdditionalVideoCost(additional_video_cost)) {
    throw new Error(`Cost per additional video must be between $${ADDITIONAL_VIDEO_COST_MIN} and $${ADDITIONAL_VIDEO_COST_MAX}`);
  }

  const nothingCustom =
    videos_per_month === null && monthly_price === null && overage_rate === null && additional_videos === 0;
  if (nothingCustom) {
    await supabase.from("retainer_months").delete().eq("client_id", clientId).eq("period_index", periodIndex);
  } else {
    const { error } = await supabase
      .from("retainer_months")
      .upsert(
        {
          client_id: clientId,
          period_index: periodIndex,
          videos_per_month,
          monthly_price,
          overage_rate,
          additional_videos,
          additional_video_cost,
        },
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
      payment_terms: paymentTerms(formData),
    })
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

async function archiveRevalidate(clientId: string) {
  revalidatePath("/admin");
  revalidatePath("/clients");
  revalidatePath("/archived");
  revalidatePath(`/clients/${clientId}`);
}

/** Pause the retainer + archive the client (they can still log in). Emails them. */
export async function pauseRetainer(clientId: string) {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("retainers").update({ status: "paused" }).eq("client_id", clientId);
  await supabase.from("clients").update({ archived: true }).eq("id", clientId);
  const { data: c } = await supabase.from("clients").select("name, email").eq("id", clientId).maybeSingle();
  if (c?.email) {
    try {
      await sendRetainerPaused({ to: c.email, name: c.name });
    } catch {}
  }
  await archiveRevalidate(clientId);
}

/**
 * Stop (end) the retainer + archive the client (they can still log in). Emails them.
 * `end_date` (form field, default today) is the last day of service: no billing
 * months start after it, and invoices already issued for those months are removed.
 * The client keeps sign-in access for CLIENT_ACCESS_DAYS from today, then is locked out.
 */
export async function stopRetainer(clientId: string, formData?: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const endDate = (formData && str(formData, "end_date")) || todaySGTString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Invalid end date");

  const accessUntil = accessUntilFor(todaySGTString());
  const { data: r } = await supabase.from("retainers").select("start_date").eq("client_id", clientId).maybeSingle();
  if (r && endDate < r.start_date) throw new Error("End date is before the retainer started");
  const { error } = await supabase.from("retainers").update({ status: "ended", end_date: endDate, access_until: accessUntil }).eq("client_id", clientId);
  if (error) throw new Error(error.message);
  if (r) {
    const lastPeriod = periodIndexForDate(r.start_date, endDate);
    await supabase.from("invoices").delete().eq("client_id", clientId).gt("period_index", lastPeriod);
  }
  await supabase.from("clients").update({ archived: true }).eq("id", clientId);
  const { data: c } = await supabase.from("clients").select("name, email").eq("id", clientId).maybeSingle();
  if (c?.email) {
    try {
      await sendRetainerStopped({ to: c.email, name: c.name, accessUntil });
    } catch {}
  }
  await archiveRevalidate(clientId);
}

/** Reactivate a paused/stopped retainer and move the client back out of archive. */
export async function resumeRetainer(clientId: string) {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("retainers").update({ status: "active", end_date: null, access_until: null }).eq("client_id", clientId);
  await supabase.from("clients").update({ archived: false }).eq("id", clientId);
  const { data: c } = await supabase.from("clients").select("name, email").eq("id", clientId).maybeSingle();
  if (c?.email) {
    try {
      await sendRetainerReactivated({ to: c.email, name: c.name });
    } catch {}
  }
  await archiveRevalidate(clientId);
}

export async function deleteClient(clientId: string) {
  await assertAdmin();
  const supabase = await createClient();

  // Grab details for the goodbye email + auth removal before deleting.
  const { data: c } = await supabase.from("clients").select("name, email").eq("id", clientId).maybeSingle();
  if (c?.email) {
    try {
      await sendAccountClosed({ to: c.email, name: c.name });
    } catch {}
  }
  // Remove the auth user so a deleted client can no longer log in.
  try {
    const admin = createAdminClient();
    const { data: prof } = await admin.from("profiles").select("id").eq("client_id", clientId).maybeSingle();
    if (prof?.id) await admin.auth.admin.deleteUser(prof.id);
  } catch {}

  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/clients");
  redirect(`/admin?toast=${encodeURIComponent("Client deleted")}`);
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
    status: toVideoStatus(formData.get("status")),
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
      status: toVideoStatus(formData.get("status")),
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/deliveries");
  revalidatePath("/admin");
}

/** Quick status change from the Deliveries board (V1 → V2 → … → Completed). */
export async function setDeliveryStatus(videoId: string, clientId: string, status: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("videos").update({ status: toVideoStatus(status) }).eq("id", videoId);
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
// Invoices — one per client per billing month. Only the number + issue date
// are stored; the PDF is rendered from live data at /api/invoices/[id].
// ---------------------------------------------------------------------------

/** Find this month's invoice, or create it (issued today) with the next free number. */
async function ensureInvoice(clientId: string, periodIndex: number) {
  const supabase = await createClient();
  return ensureInvoiceWith(supabase, clientId, periodIndex, todaySGTString());
}

/** Admin: issue the invoice for a billing month (no-op if it already exists). */
export async function createInvoice(clientId: string, periodIndex: number) {
  await assertAdmin();
  await ensureInvoice(clientId, periodIndex);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
}

/** Admin: correct an invoice's number or issue date. */
export async function updateInvoice(invoiceId: string, clientId: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const invoice_no = str(formData, "invoice_no").toUpperCase();
  const issue_date = str(formData, "issue_date");
  if (!invoice_no) throw new Error("Enter an invoice number");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) throw new Error("Enter a valid issue date");
  const { error } = await supabase.from("invoices").update({ invoice_no, issue_date }).eq("id", invoiceId);
  if (error) throw new Error(error.code === "23505" ? "That invoice number is already used" : error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export async function setPayment(input: {
  clientId: string;
  periodIndex: number;
  periodStart: string;
  kind: "deposit" | "balance" | "full" | "overage";
  amount: number;
  paid: boolean;
  /** Explicit paid date (yyyy-mm-dd); defaults to today when marking paid. */
  paidOn?: string;
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
        paid_on: input.paid ? (input.paidOn || today) : null,
      },
      { onConflict: "client_id,period_index,kind" },
    );
  if (error) throw new Error(error.message);
  // Marking anything paid guarantees the month has an invoice, so the client
  // can download their (paid) copy right away.
  if (input.paid) {
    try {
      await ensureInvoice(input.clientId, input.periodIndex);
    } catch {
      /* invoice creation is best-effort here; the payment itself is recorded */
    }
  }
  revalidatePath(`/clients/${input.clientId}`);
  revalidatePath("/admin");
  revalidatePath("/invoices");
}
