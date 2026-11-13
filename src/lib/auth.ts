import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'admin_session';

export function adminSessionValue() {
  const user = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || '';
  const raw = `${user}:${password}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash * 33) ^ raw.charCodeAt(i)) >>> 0;
  }
  return `edgelink.${hash.toString(16)}`;
}

export function isAdminRequest(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE)?.value === adminSessionValue();
}

export function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
