import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(`/?toast=${encodeURIComponent("Signed out")}`, request.url), {
    status: 303,
  });
}
