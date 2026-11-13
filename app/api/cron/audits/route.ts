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

  const fallbackEnv = (process.env.FALLBACK_PROCESS || '').trim().toLowerCase();
  const fallback = fallbackEnv === '' || fallbackEnv === 'true' || fallbackEnv === '1' || fallbackEnv === 'yes';
  let processed = 0;

  const audits = await db.orm.public.Audit.orderBy((audit) => audit.createdAt.asc()).all();
  const queued = audits.filter((audit) => audit.status === 'QUEUED');

  if (fallback && queued[0]) {
    await runAudit(queued[0].id);
    processed += 1;
  }

  return NextResponse.json({
    enqueued,
    processed,
    queued: queued.length,
    fallback,
    fallbackEnv: process.env.FALLBACK_PROCESS ?? null,
  });
}
