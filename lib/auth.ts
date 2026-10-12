import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accessClosed } from "@/lib/retainer/access";
import { closeExpiredClientAccounts } from "@/lib/close-accounts";
import { todaySGTString } from "@/lib/time";
import type { Profile } from "@/lib/types";

/** Current user's profile, or null if signed out / no profile yet. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile) ?? { id: user.id, email: user.email ?? "", role: "pending", client_id: null, created_at: "" };
}

/** Require an admin session; redirect otherwise. Returns the profile. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login/admin");
  if (profile.role !== "admin") redirect(profile.role === "client" ? "/me" : "/no-access");
  return profile;
}

/** Require a client session; redirect otherwise. Returns the profile. */
export async function requireClient(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login/client");
  if (profile.role === "admin") redirect("/admin");
  if (profile.role !== "client" || !profile.client_id) redirect("/no-access");

  // Ended retainer past its access window → locked out; remove the logins now
  // rather than waiting for the daily cron.
  const supabase = await createClient();
  const { data: retainer } = await supabase
    .from("retainers")
    .select("status, access_until")
    .eq("client_id", profile.client_id)
    .maybeSingle();
  if (accessClosed(retainer, todaySGTString())) {
    try {
      await closeExpiredClientAccounts(profile.client_id);
    } catch {}
    redirect("/no-access?closed=1");
  }
  return profile;
}
