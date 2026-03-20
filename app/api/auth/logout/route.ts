// ============================================================
// app/api/auth/logout/route.ts
//
// Clears the "__session" HTTP-only cookie that is set by
// setSessionCookie() in auth.action.ts, then returns 200.
// The client then redirects to /sign-in.
//
// Bug fix: the original route cleared "session" (wrong name).
// The app uses "__session" exclusively — middleware reads it
// as SESSION_COOKIE_NAME = "__session". Only that cookie is
// cleared here to avoid confusion.
// ============================================================

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear "__session" — the ONLY session cookie this app sets.
  // Must match the name, path, and attributes used in auth.action.ts → setSessionCookie().
  response.cookies.set("__session", "", {
    maxAge: 0,   // Expire immediately
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
