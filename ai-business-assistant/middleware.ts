import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  buildDashboardRedirectUrl,
  buildLoginRedirectUrl,
  getClientIp,
  isApiRoute,
  isAuthRoute,
  isProtectedRoute,
  isStaticAsset,
} from "@/middleware/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isApiRoute(pathname)) {
    response.headers.set("x-request-id", crypto.randomUUID());
    return response;
  }

  if (isProtectedRoute(pathname) && !user) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  if (isAuthRoute(pathname) && user) {
    return NextResponse.redirect(buildDashboardRedirectUrl(request));
  }

  response.headers.set("x-request-id", crypto.randomUUID());
  response.headers.set("x-client-ip", getClientIp(request));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
