import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { assembleClient, type ClientView } from "@/lib/retainer/assemble";
import type { Client, Payment, Retainer, VideoRow } from "@/lib/types";

/**
 * Fetch and assemble every client using the service-role key — for trusted
 * server contexts with no user session (e.g. the cron reminder job).
 */
export async function getAllClientViewsAdmin(): Promise<ClientView[]> {
  const supabase = createAdminClient();

  const [{ data: clients }, { data: retainers }, { data: videos }, { data: payments }] =
    await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("retainers").select("*"),
      supabase.from("videos").select("*"),
      supabase.from("payments").select("*"),
    ]);

  const retByClient = new Map<string, Retainer>();
  for (const r of (retainers ?? []) as Retainer[]) retByClient.set(r.client_id, r);

  const vidByClient = new Map<string, VideoRow[]>();
  for (const v of (videos ?? []) as VideoRow[]) (vidByClient.get(v.client_id) ?? vidByClient.set(v.client_id, []).get(v.client_id)!).push(v);

  const payByClient = new Map<string, Payment[]>();
  for (const p of (payments ?? []) as Payment[]) (payByClient.get(p.client_id) ?? payByClient.set(p.client_id, []).get(p.client_id)!).push(p);

  return ((clients ?? []) as Client[]).map((c) =>
    assembleClient(c, retByClient.get(c.id) ?? null, vidByClient.get(c.id) ?? [], payByClient.get(c.id) ?? []),
  );
}
