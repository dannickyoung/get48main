import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { assembleClient, type ClientView } from "@/lib/retainer/assemble";
import { todaySGT } from "@/lib/time";
import type { Client, Payment, Retainer, RetainerMonth, VideoRow } from "@/lib/types";

/**
 * Fetch and assemble every client using the service-role key — for trusted
 * server contexts with no user session (e.g. the cron reminder job).
 */
export async function getAllClientViewsAdmin(): Promise<ClientView[]> {
  const supabase = createAdminClient();

  const [{ data: clients }, { data: retainers }, { data: videos }, { data: payments }, { data: months }] =
    await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("retainers").select("*"),
      supabase.from("videos").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("retainer_months").select("*"),
    ]);

  const retByClient = new Map<string, Retainer>();
  for (const r of (retainers ?? []) as Retainer[]) retByClient.set(r.client_id, r);

  const vidByClient = new Map<string, VideoRow[]>();
  for (const v of (videos ?? []) as VideoRow[]) (vidByClient.get(v.client_id) ?? vidByClient.set(v.client_id, []).get(v.client_id)!).push(v);

  const payByClient = new Map<string, Payment[]>();
  for (const p of (payments ?? []) as Payment[]) (payByClient.get(p.client_id) ?? payByClient.set(p.client_id, []).get(p.client_id)!).push(p);

  const monByClient = new Map<string, RetainerMonth[]>();
  for (const m of (months ?? []) as RetainerMonth[]) (monByClient.get(m.client_id) ?? monByClient.set(m.client_id, []).get(m.client_id)!).push(m);

  const asOf = todaySGT();
  return ((clients ?? []) as Client[]).map((c) =>
    assembleClient(c, retByClient.get(c.id) ?? null, vidByClient.get(c.id) ?? [], payByClient.get(c.id) ?? [], asOf, monByClient.get(c.id) ?? []),
  );
}
