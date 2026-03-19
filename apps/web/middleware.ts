import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Wrap the auth middleware to allow demo mode access
export async function middleware(request: NextRequest) {
  // Allow demo mode — skip auth for requests with demo=true query param
  // or when accessing dashboard pages without auth (dev/demo usage)
  const { searchParams } = new URL(request.url);
  if (searchParams.get('demo') === 'true') {
    return NextResponse.next();
  }

  // For API routes, let the route handler manage auth (they check demo mode internally)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For dashboard pages, try auth but don't block if it fails
  // This allows the pages to load and use demo mode via client-side fetch
  try {
    const session = await auth();
    if (!session) {
      // In production, redirect to login. In dev, allow through for demo.
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch {
    // Auth error (e.g., missing provider config) — allow through in dev
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/assessment/:path*',
    '/category/:path*',
    '/history/:path*',
    '/upload/:path*',
    '/sites/:path*',
    '/settings/:path*',
    '/api/assessment/:path*',
    '/api/upload/:path*',
    '/api/export/:path*',
  ],
};
