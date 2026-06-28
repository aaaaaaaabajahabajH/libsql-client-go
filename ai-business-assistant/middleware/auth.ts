import type { NextRequest } from "next/server";

import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/utils/constants";

/**
 * Route classification helpers extracted from middleware.ts so
 * the edge runtime file stays thin and testable in isolation.
 */

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function isStaticAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js|map)$/i.test(
    pathname,
  );
}

/**
 * Build the redirect URL for unauthenticated access to a protected route.
 * Preserves the original destination so we can redirect back after login.
 */
export function buildLoginRedirectUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  const returnTo = request.nextUrl.pathname + request.nextUrl.search;

  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("returnTo", returnTo);
  return url;
}

/**
 * Build the redirect URL for already-authenticated users hitting an auth page.
 * Uses the `returnTo` param if present, otherwise sends to /dashboard.
 */
export function buildDashboardRedirectUrl(request: NextRequest): URL {
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  const url = request.nextUrl.clone();

  url.search = "";

  if (returnTo && returnTo.startsWith("/") && !isAuthRoute(returnTo)) {
    url.pathname = returnTo;
  } else {
    url.pathname = "/dashboard";
  }

  return url;
}
