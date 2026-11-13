import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { isAdminRequest, unauthorized } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const audits = await db.orm.public.Audit.orderBy((audit) => audit.createdAt.desc())
    .limit(50)
    .include('client', (client) => client)
    .all();

  return NextResponse.json(audits);
}
