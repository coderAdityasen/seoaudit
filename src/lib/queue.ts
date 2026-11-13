import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing in .env file");
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const auditQueue = new Queue('seo-audit-jobs', { connection });