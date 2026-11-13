import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { buildPdfBytes } from '@/src/report/pdf';
import type { AuditResult } from '@/src/types/audit';

function asResult(value: unknown): AuditResult | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as AuditResult;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value as AuditResult;
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audit = await db.orm.public.Audit.where({ id })
    .include('client', (client) => client)
    .first();

  const result = asResult(audit?.result);
  if (!audit?.client || !result) {
    return NextResponse.json({ error: 'PDF not ready' }, { status: 404 });
  }

  const bytes = await buildPdfBytes({
    client: audit.client,
    auditId: id,
    result,
  });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="audit-${id}.pdf"`,
    },
  });
}
