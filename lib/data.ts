import { createClient } from "@/lib/supabase/server";
import { assembleClient, type ClientView } from "@/lib/retainer/assemble";
import { todaySGT } from "@/lib/time";
import type { Client, Payment, Retainer, VideoRow } from "@/lib/types";

/** Every client, fully assembled — for the admin overview. */
export async function getAllClientViews(): Promise<ClientView[]> {
  const supabase = await createClient();

  const [{ data: clients }, { data: retainers }, { data: videos }, { data: payments }] =
    await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: true }),
      supabase.from("retainers").select("*"),
      supabase.from("videos").select("*"),
      supabase.from("payments").select("*"),
    ]);

  const retByClient = new Map<string, Retainer>();
  for (const r of (retainers ?? []) as Retainer[]) retByClient.set(r.client_id, r);

  const vidByClient = groupBy((videos ?? []) as VideoRow[], (v) => v.client_id);
  const payByClient = groupBy((payments ?? []) as Payment[], (p) => p.client_id);

  const asOf = todaySGT();
  return ((clients ?? []) as Client[]).map((c) =>
    assembleClient(c, retByClient.get(c.id) ?? null, vidByClient.get(c.id) ?? [], payByClient.get(c.id) ?? [], asOf),
  );
}

/** A single client, fully assembled. Returns null if not visible to the caller. */
export async function getClientView(clientId: string): Promise<ClientView | null> {
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (!client) return null;

  const [{ data: retainer }, { data: videos }, { data: payments }] = await Promise.all([
    supabase.from("retainers").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("videos").select("*").eq("client_id", clientId).order("delivered_on", { ascending: false }),
    supabase.from("payments").select("*").eq("client_id", clientId),
  ]);

  return assembleClient(
    client as Client,
    (retainer as Retainer) ?? null,
    (videos ?? []) as VideoRow[],
    (payments ?? []) as Payment[],
    todaySGT(),
  );
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const arr = map.get(k);
    if (arr) arr.push(row);
    else map.set(k, [row]);
  }
  return map;
}
