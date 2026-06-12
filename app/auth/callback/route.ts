import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Magic-link / OTP callback. Exchanges the code for a session, then routes by role. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({ type: type as "magiclink" | "email", token_hash: tokenHash });
  }

  // Route by role.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let dest = "/no-access";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "admin") dest = "/dashboard";
    else if (profile?.role === "client") dest = "/me";
  }

  return NextResponse.redirect(`${origin}${dest}`);
}
