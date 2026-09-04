import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the "middleware" convention to "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Exclude /api (routes handle their own auth), static assets, and the
  // public case-study media used by the marketing site.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|case-studies|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)"],
};
