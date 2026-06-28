import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  buildDashboardRedirectUrl,
  buildLoginRedirectUrl,
  isApiRoute,
  isAuthRoute,
  isProtectedRoute,
  isStaticAsset,
} from "@/middleware/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals immediately
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

  // Refresh the session — this is required to keep tokens alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // API routes: let them handle their own auth
  if (isApiRoute(pathname)) {
    return response;
  }

  // Protected route — unauthenticated user → redirect to /login
  if (isProtectedRoute(pathname) && !user) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  // Auth route — already authenticated user → redirect to /dashboard
  if (isAuthRoute(pathname) && user) {
    return NextResponse.redirect(buildDashboardRedirectUrl(request));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
