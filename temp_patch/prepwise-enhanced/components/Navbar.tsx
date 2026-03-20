"use client";
// ============================================================
// components/Navbar.tsx  (FIXED logout redirect)
//
// BUG: signOut() only clears the Firebase client token.
// The server-side session cookie stays alive, so middleware
// redirects back to dashboard on every navigation.
//
// FIX: Call /api/auth/logout (clears cookie) THEN redirect.
// Using router.push() alone doesn't work here because the
// cookie is still present during the push — must use
// window.location.href to force a full page reload so
// middleware re-evaluates with the cleared cookie.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/resume", label: "Resume Analyzer" },
  { href: "/interview", label: "Mock Interview" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      // Step 1: Sign out from Firebase client (clears local token)
      await signOut(auth);

      // Step 2: Call server to clear the session cookie.
      // This is the missing step — without it the cookie persists
      // and middleware keeps the user "logged in".
      await fetch("/api/auth/logout", { method: "POST" });

      // Step 3: Hard redirect (NOT router.push) so middleware
      // re-evaluates with no cookie present.
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if something fails, force redirect
      window.location.href = "/sign-in";
    }
  }

  return (
    <nav className="border-b border-slate-800 bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"
        >
          PrepWise
        </Link>

        {/* Nav links + logout */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === link.href
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                Signing out…
              </span>
            ) : (
              "Sign Out"
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
