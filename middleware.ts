// ============================================================
// middleware.ts  (FIXED)
//
// The original middleware likely used:
//   const session = request.cookies.get("session")?.value
//   if (!session) redirect to sign-in
//
// But the bug is: after logout, the cookie is cleared but if
// the middleware had any edge-case (missing cookie name match,
// or not covering all protected routes), users got stuck.
//
// This version explicitly:
// 1. Defines ALL protected routes
// 2. Defines ALL public routes (sign-in, sign-up)
// 3. Redirects unauthenticated users from protected → /sign-in
// 4. Redirects authenticated users away from auth pages → /
// ============================================================

import { NextRequest, NextResponse } from "next/server";

// Cookie name must match EXACTLY what you set in your sign-in action
// Common names: "session", "__session", "token"
const SESSION_COOKIE_NAME = "__session";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/resume", "/interview", "/history", "/profile", "/settings"];

// Routes only for unauthenticated users (redirect away if logged in)
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = !!sessionCookie && sessionCookie.length > 0;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== "/" && pathname.startsWith(prefix))
  );

  // Unauthenticated user trying to access a protected page → sign-in
  if (!isAuthenticated && isProtectedRoute && !isAuthRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    // Preserve where they were going so we can redirect after login
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user trying to access sign-in or sign-up → dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
