/**
 * Lock-out for ended retainers: once the access window has passed, delete
 * every login linked to the client (owner + team members) and drop the member
 * emails so they can't re-link on sign-up. The client record, videos and
 * payments are kept for the studio's books. Idempotent; server-only.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { todaySGTString } from "@/lib/time";

export async function closeExpiredClientAccounts(clientId?: string): Promise<{ clientId: string; deletedLogins: number }[]> {
  const admin = createAdminClient();
  let q = admin.from("retainers").select("client_id").eq("status", "ended").lt("access_until", todaySGTString());
  if (clientId) q = q.eq("client_id", clientId);
  const { data: expired, error } = await q;
  if (error) throw new Error(error.message);

  const closed: { clientId: string; deletedLogins: number }[] = [];
  for (const { client_id } of expired ?? []) {
    const { data: profiles } = await admin.from("profiles").select("id").eq("client_id", client_id);
    let deletedLogins = 0;
    for (const p of profiles ?? []) {
      const { error: delErr } = await admin.auth.admin.deleteUser(p.id);
      if (!delErr) deletedLogins++;
    }
    await admin.from("client_members").delete().eq("client_id", client_id);
    if (deletedLogins > 0) closed.push({ clientId: client_id, deletedLogins });
  }
  return closed;
}
