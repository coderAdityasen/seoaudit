import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { isAdminRequest, unauthorized } from '@/src/lib/auth';

export async function GET() {
  const clients = await db.orm.public.Client.orderBy((client) => client.createdAt.desc()).all();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  const body = await req.json();
  const name = String(body.name || '').trim();
  const websiteUrl = String(body.websiteUrl || '').trim();
  const businessType = String(body.businessType || '').trim();
  const city = String(body.city || '').trim();
  const state = String(body.state || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();
  const email = String(body.email || '').trim();

  if (!name || !websiteUrl || !businessType || !city || !state) {
    return NextResponse.json(
      { error: 'name, websiteUrl, businessType, city, and state are required' },
      { status: 400 },
    );
  }

  try {
    const parsed = new URL(websiteUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'websiteUrl must be http or https' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'websiteUrl is invalid' }, { status: 400 });
  }

  const existing = await db.orm.public.Client.where({ websiteUrl }).first();
  if (existing) {
    return NextResponse.json({ error: 'A client with this website already exists' }, { status: 409 });
  }

  const client = await db.orm.public.Client.create({
    name,
    websiteUrl,
    businessType,
    city,
    state,
    ...(whatsapp ? { whatsapp } : {}),
    ...(email ? { email } : {}),
  });

  return NextResponse.json(client, { status: 201 });
}
