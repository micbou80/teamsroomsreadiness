import { NextRequest, NextResponse } from 'next/server';

/**
 * Protects dashboard routes — unauthenticated users are redirected to /login.
 * Demo mode (?demo=true) bypasses auth so users can explore without signing in.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow demo mode through without auth
  if (searchParams.get('demo') === 'true') {
    return NextResponse.next();
  }

  // Check for session cookie (Auth.js sets one of these)
  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token') ||
    // Check chunked cookies
    request.cookies.has('authjs.session-token.0') ||
    request.cookies.has('__Secure-authjs.session-token.0');

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect dashboard routes — excludes /login, /api, /_next, static files
  matcher: [
    '/',
    '/assessment/:path*',
    '/action-plan/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/help/:path*',
  ],
};
