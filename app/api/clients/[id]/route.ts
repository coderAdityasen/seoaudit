import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await db.orm.public.Client.where({ id }).first();
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const audits = await db.orm.public.Audit.where({ clientId: id })
    .orderBy((audit) => audit.createdAt.desc())
    .all();

  return NextResponse.json({ client, audits });
}
