import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { db } from '../../src/prisma/db';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is missing in .env file");
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

const processAuditJob = async (job: Job) => {
  const { auditId } = job.data;
  console.log(`Job pick kar liya: ${auditId}`);

  try {
    // Status update: RUNNING
    await db.orm.public.Audit.where({id: auditId}).update({
     status: 'RUNNING', progress: 10, currentStep: 'Crawling URL'
    });

    // Step 1: Fetch + Cheerio URL crawl karega[cite: 8]
    console.log('Crawling...');

    // Step 2 & 3: PageSpeed Insights aur Google Search Console mock API calls[cite: 8]
    // Step 4, 5 & 6: Schema.org validator, On-page analysis, aur robots/sitemap checks[cite: 8]
    // Step 7: DataForSEO rankings mock call[cite: 8]
    
    // Step 8: Claude API se analysis (Real ya Mock) JSON format mein[cite: 8]
    await db.orm.public.Audit.where({ id: auditId }).update({
    progress: 60, currentStep: 'Claude AI Analysis' 
    });

    // Step 9: Supabase/Neon (Postgres) mein audit result save karna[cite: 8]

    // Step 10: Puppeteer se PDF Report Generate karna[cite: 8]

    // Step 11: Twilio WhatsApp mock console.log karna[cite: 8]
    await db.orm.public.Audit.where({ id: auditId }).update({
     progress: 90, currentStep: 'Sending Notifications' 
    });

    // Audit Complete
    await db.orm.public.Audit.where({ id: auditId }).update({
        status: 'COMPLETED', 
        progress: 100, 
        currentStep: 'Done',
        completedAt: new Date()
    });

    console.log(`Job ${auditId} successfully complete ho gaya!`);
  } catch (error: any) {
    console.error(`Job ${auditId} fail ho gaya:`, error);
    await db.orm.public.Audit.where({ id: auditId }).update({
        status: 'FAILED', 
        errorMessage: error.message || 'Unknown error'
    });
  }
};

export const auditWorker = new Worker('seo-audit-jobs', processAuditJob, { connection });

auditWorker.on('ready', () => {
  console.log('Worker start ho gaya hai aur jobs ka wait kar raha hai...');
});

auditWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} error ke sath fail hua: ${err.message}`);
});