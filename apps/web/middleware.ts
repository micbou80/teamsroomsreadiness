export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/assessment/:path*', '/category/:path*', '/history/:path*', '/upload/:path*', '/sites/:path*', '/settings/:path*', '/api/assessment/:path*', '/api/upload/:path*', '/api/export/:path*'],
};
