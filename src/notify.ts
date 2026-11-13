import { db } from './prisma/db';
import { sendWhatsApp } from './mocks/runtime';

type NotifyClient = {
  id: string;
  email: string | null;
  name: string;
};

async function record(
  auditId: string,
  channel: 'whatsapp' | 'email',
  status: string,
  providerId?: string,
) {
  await db.orm.public.Notification.create({
    auditId,
    channel,
    status,
    ...(providerId ? { providerId } : {}),
  });
}

export async function notify({
  auditId,
  client,
  pdfPath,
  score,
}: {
  auditId: string;
  client: NotifyClient;
  pdfPath: string;
  score: number;
}) {
  try {
    const whatsapp = await sendWhatsApp(client.id, pdfPath, score);
    await record(auditId, 'whatsapp', whatsapp.status || 'mock_sent', whatsapp.sid);
  } catch (error) {
    console.error('[NOTIFY] WhatsApp failed:', error);
    try {
      await record(auditId, 'whatsapp', 'failed');
    } catch (writeError) {
      console.error('[NOTIFY] could not store WhatsApp failure:', writeError);
    }
  }

  try {
    console.log('[MOCK EMAIL] → Client:', client.email || client.name);
    console.log('[MOCK EMAIL] → Score: ', `${score}/100`);
    console.log('[MOCK EMAIL] → Report:', pdfPath);
    await record(auditId, 'email', 'mock_sent');
  } catch (error) {
    console.error('[NOTIFY] Email failed:', error);
    try {
      await record(auditId, 'email', 'failed');
    } catch (writeError) {
      console.error('[NOTIFY] could not store email failure:', writeError);
    }
  }
}
