import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that never require auth.
const PUBLIC_PATHS = ["/login", "/auth", "/no-access", "/preview"];

/** Refresh the auth session on every request and gate unauthenticated traffic. */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // The marketing root is fully public; and if Supabase isn't configured yet,
  // never crash — just pass the request through.
  if (path === "/" || !url || !anon) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && !isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    return NextResponse.redirect(to);
  }

  // Force a first-time user to set a real password before going anywhere else.
  if (
    user &&
    user.user_metadata?.must_change_password === true &&
    !path.startsWith("/account/password") &&
    !path.startsWith("/auth")
  ) {
    const to = request.nextUrl.clone();
    to.pathname = "/account/password";
    return NextResponse.redirect(to);
  }

  // Already signed in and hitting the login screen → send to the app.
  if (user && path === "/login") {
    const to = request.nextUrl.clone();
    to.pathname = "/dashboard";
    return NextResponse.redirect(to);
  }

  return response;
}
