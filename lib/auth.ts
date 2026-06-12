import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect(profile.role === "client" ? "/me" : "/no-access");
  return profile;
}

/** Require a client session; redirect otherwise. Returns the profile. */
export async function requireClient(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/dashboard");
  if (profile.role !== "client" || !profile.client_id) redirect("/no-access");
  return profile;
}
