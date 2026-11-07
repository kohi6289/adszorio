import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE, currencyForCountry } from "@/lib/currency";

// Next 16 "proxy" (formerly middleware).
//  1. Public pages: pick a default display currency from the visitor's country (Vercel geo header)
//     on the first visit. A visitor's own choice (cookie) always wins.
//  2. /admin: keep the Supabase login session fresh and bounce signed-out visitors to the login page.
//     (Real authorisation happens again on the server in every admin page and action.)
const SUPPORTED = ["USD", "EUR", "GBP", "CAD", "AUD", "AED"];

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return adminSession(request);

  if (request.cookies.has(CURRENCY_COOKIE)) return NextResponse.next();
  const currency = currencyForCountry(request.headers.get("x-vercel-ip-country"), SUPPORTED);
  const headers = new Headers(request.headers);
  headers.set("x-adz-currency", currency);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

async function adminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!user && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
