import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('__session')?.value;
    const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') ||
        request.nextUrl.pathname.startsWith('/sign-up') ||
        request.nextUrl.pathname.startsWith('/login');

    const isHomePage = request.nextUrl.pathname === '/';

    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is not logged in and tries to access protected pages
    // Protected pages: /dashboard, /interview, /profile, /settings, /history
    const isProtectedPath = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/interview') ||
        request.nextUrl.pathname.startsWith('/profile') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/history');

    if (!token && isProtectedPath) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Optional: If user is on homepage and logged in, redirect to dashboard
    // if (token && isHomePage) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
