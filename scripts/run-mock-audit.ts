import 'dotenv/config';
import { db } from '../src/prisma/db';
import { USE_MOCKS } from '../src/mocks/runtime';
import { runAudit } from '../src/worker/runAudit';

async function main() {
  const client = await db.orm.public.Client.where({
    websiteUrl: 'https://example-dental-clinic.com',
  }).first();

  if (!client) {
    throw new Error('Example Dental Clinic is missing. Run npm run seed first.');
  }

  const audit = await db.orm.public.Audit.create({
    clientId: client.id,
    triggeredBy: 'manual',
  });

  console.log('USE_MOCKS', USE_MOCKS);
  console.log('audit', audit.id);

  await runAudit(audit.id);

  const saved = await db.orm.public.Audit.where({ id: audit.id })
    .include('notifications', (notification) => notification)
    .first();

  console.log(
    JSON.stringify({
      status: saved?.status,
      score: saved?.overallScore,
      step: saved?.currentStep,
      pdfPath: saved?.pdfPath,
      notifications: saved?.notifications?.map((item) => ({
        channel: item.channel,
        status: item.status,
      })),
    }),
  );

  await db.close();
}

main().catch(async (error) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
