// ============================================================
// app/api/auth/logout/route.ts
// FIX: Logout was not redirecting because the server-side
// session cookie was never cleared. Firebase signOut() only
// clears the CLIENT-side token — the cookie persists, so
// middleware keeps seeing a valid session and bounces back.
//
// This route: clears the session cookie + returns 200.
// The client then redirects to /sign-in.
// ============================================================

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the session cookie — must match the name, path, and
  // domain used when it was SET (typically in your sign-in action).
  // Common names used in Firebase + Next.js setups:
  response.cookies.set("session", "", {
    maxAge: 0,          // Expire immediately
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Also clear alternate cookie names just in case
  response.cookies.set("__session", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
