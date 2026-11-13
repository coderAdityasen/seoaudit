import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { auditQueue } from '@/src/lib/queue';
import { isAdminRequest, unauthorized } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    const client = await db.orm.public.Client.where({ id: clientId }).first();
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const audit = await db.orm.public.Audit.create({ clientId, triggeredBy: 'manual' });
    await auditQueue.add('run-audit', { auditId: audit.id });

    return NextResponse.json({ auditId: audit.id }, { status: 202 });
  } catch (error) {
    console.error('Error creating audit job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
