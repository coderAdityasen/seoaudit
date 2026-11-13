import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is missing in .env file');
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});

export const auditQueue = new Queue('seo-audit-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});
