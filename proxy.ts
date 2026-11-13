import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminSessionValue } from './src/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isAdminPage) return NextResponse.next();

  const session = request.cookies.get(ADMIN_COOKIE)?.value;
  if (session === adminSessionValue()) return NextResponse.next();

  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
