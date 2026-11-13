import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminSessionValue } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '');
  const password = String(body.password || '');
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!expectedPassword || username !== expectedUser || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
