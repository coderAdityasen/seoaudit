import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const audit = await db.orm.public.Audit.where({ id })
    .include('client', (client) => client)
    .include('notifications', (notification) => notification)
    .first();

  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  return NextResponse.json(audit);
}
