import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { auditQueue } from '@/src/lib/queue';
import { runAudit } from '@/src/worker/runAudit';

export const maxDuration = 10;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    req.headers.get('x-cron-secret') === secret ||
    req.headers.get('authorization') === `Bearer ${secret}`
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const clients = await db.orm.public.Client.all();
  let enqueued = 0;

  for (const client of clients) {
    const latest = await db.orm.public.Audit.where({ clientId: client.id })
      .orderBy((audit) => audit.createdAt.desc())
      .first();

    if (latest && new Date(latest.createdAt).getTime() >= since.getTime()) continue;

    const audit = await db.orm.public.Audit.create({
      clientId: client.id,
      triggeredBy: 'cron',
    });
    await auditQueue.add('run-audit', { auditId: audit.id });
    enqueued += 1;
  }

  let processed = 0;
  if (process.env.FALLBACK_PROCESS === 'true') {
    const queued = await db.orm.public.Audit.where({ status: 'QUEUED' })
      .orderBy((audit) => audit.createdAt.asc())
      .limit(1)
      .all();

    for (const audit of queued) {
      await runAudit(audit.id);
      processed += 1;
    }
  }

  return NextResponse.json({ enqueued, processed });
}
