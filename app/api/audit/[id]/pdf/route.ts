import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { reportsDir } from '@/src/lib/reports';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audit = await db.orm.public.Audit.where({ id }).select('id', 'pdfPath').first();

  if (!audit?.pdfPath) {
    return NextResponse.json({ error: 'PDF not ready' }, { status: 404 });
  }

  const root = path.resolve(reportsDir());
  const filePath = path.resolve(audit.pdfPath);
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (filePath !== root && !filePath.startsWith(rootPrefix)) {
    return NextResponse.json({ error: 'Invalid report path' }, { status: 400 });
  }

  try {
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-${id}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'PDF file is missing' }, { status: 404 });
  }
}
