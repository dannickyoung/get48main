/**
 * Invoice issuing. An invoice exists for every billing month that has started
 * (one per client per month). Numbers come from the DB sequence and are
 * collision-safe; issue date defaults to the month's start.
 */
import { addMonths, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDateOnly } from "@/lib/retainer/engine";
import type { ClientView } from "@/lib/retainer/assemble";
import type { Invoice } from "@/lib/types";
import { INVOICE_BUSINESS } from "./config";

/** Find this month's invoice, or create it with the next free sequential number. */
export async function ensureInvoice(
  supabase: SupabaseClient,
  clientId: string,
  periodIndex: number,
  issueDate: string,
): Promise<Invoice> {
  const { data: existing } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .eq("period_index", periodIndex)
    .maybeSingle();
  if (existing) return existing as Invoice;

  // Draw numbers from the sequence until one is free (numbers issued by hand or
  // backfilled ahead of the counter are simply skipped). The unique index on
  // invoice_no is the guard.
  for (let attempt = 0; attempt < 100; attempt++) {
    const { data: no, error: seqErr } = await supabase.rpc("next_invoice_no", { prefix: INVOICE_BUSINESS.numberPrefix });
    if (seqErr || !no) throw new Error(seqErr?.message ?? "Couldn't allocate an invoice number");

    const { data: created, error } = await supabase
      .from("invoices")
      .insert({ client_id: clientId, period_index: periodIndex, invoice_no: no as string, issue_date: issueDate })
      .select("*")
      .single();
    if (!error) return created as Invoice;
    if (error.code !== "23505") throw new Error(error.message);

    // Unique violation: either this month was created concurrently (use it)…
    const { data: again } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientId)
      .eq("period_index", periodIndex)
      .maybeSingle();
    if (again) return again as Invoice;
    // …or the number was taken — loop and draw the next one.
  }
  throw new Error("Couldn't find a free invoice number");
}

/**
 * Make sure every started billing month of every active retainer has an
 * invoice. Creates the missing ones (oldest first, so numbering follows the
 * calendar) and appends them to each view's `invoices`. Best-effort: a failure
 * never breaks page rendering. Server-only (uses the service-role client).
 */
export async function syncInvoices(views: ClientView[]): Promise<void> {
  const missing: { view: ClientView; periodIndex: number; start: Date }[] = [];
  for (const view of views) {
    const { retainer, computation, client } = view;
    if (!retainer || !computation || client.archived || retainer.status !== "active") continue;
    if (computation.current.state !== "active") continue;
    const have = new Set(view.invoices.map((i) => i.period_index));
    const start = parseDateOnly(retainer.start_date);
    for (let k = 0; k <= computation.current.periodIndex; k++) {
      if (!have.has(k)) missing.push({ view, periodIndex: k, start: addMonths(start, k) });
    }
  }
  if (missing.length === 0) return;
  missing.sort((a, b) => a.start.getTime() - b.start.getTime());

  try {
    const admin = createAdminClient();
    for (const m of missing) {
      const inv = await ensureInvoice(admin, m.view.client.id, m.periodIndex, format(m.start, "yyyy-MM-dd"));
      m.view.invoices.push(inv);
    }
  } catch {
    /* best-effort — the page still renders with whatever invoices exist */
  }
}
