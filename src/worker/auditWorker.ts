import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { runAudit } from './runAudit';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is missing in .env file');
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});

const worker = new Worker(
  'seo-audit-jobs',
  async (job) => {
    console.log('[WORKER] picked job', job.id, job.data);
    await runAudit(job.data.auditId);
  },
  { connection, concurrency: 1, drainDelay: 30, stalledInterval: 60000 },
);

worker.on('ready', () => {
  console.log('[WORKER] listening on seo-audit-jobs');
});

worker.on('completed', (job) => {
  console.log('[WORKER] completed', job.id);
});

worker.on('failed', (job, error) => {
  console.error('[WORKER] failed', job?.id, error.message);
});
