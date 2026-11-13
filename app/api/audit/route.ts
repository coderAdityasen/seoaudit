import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { auditQueue } from '@/src/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId } = body;
    
    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    // Database mein audit entry create karna
    const audit = await db.orm.public.Audit.create({clientId});

    // Redis Queue mein job add karna
    await auditQueue.add('run-audit', { auditId: audit.id });

    // Assessment ke mutabiq 202 status return karna hai
    return NextResponse.json({ auditId: audit.id }, { status: 202 });
    
  } catch (error) {
    console.error("Error creating audit job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}