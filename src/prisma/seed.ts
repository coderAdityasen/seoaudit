import { db } from './db';

const clients = [
  {
    name: 'Example Dental Clinic',
    websiteUrl: 'https://example-dental-clinic.com',
    businessType: 'Dental clinic',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+910000000000',
    email: 'clinic@example.com',
  },
  {
    name: 'Pune Nest Realty',
    websiteUrl: 'https://example-pune-nest-realty.com',
    businessType: 'Real estate agency',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+910000000001',
    email: 'hello@pune-nest.example',
  },
  {
    name: 'Kothrud Smile Studio',
    websiteUrl: 'https://example-kothrud-smile.com',
    businessType: 'Dental clinic',
    city: 'Pune',
    state: 'Maharashtra',
    whatsapp: '+910000000002',
    email: 'studio@kothrud-smile.example',
  },
];

async function main() {
  for (const client of clients) {
    const existing = await db.orm.public.Client.where({ websiteUrl: client.websiteUrl }).first();
    if (existing) {
      await db.orm.public.Client.where({ id: existing.id }).update({
        name: client.name,
        businessType: client.businessType,
        city: client.city,
        state: client.state,
        whatsapp: client.whatsapp,
        email: client.email,
      });
      console.log(`updated ${client.name}  ${existing.id}`);
      continue;
    }
    const created = await db.orm.public.Client.create(client);
    console.log(`created ${created.name}  ${created.id}`);
  }
  await db.close();
}

main().catch(async (error) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
