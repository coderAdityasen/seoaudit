# SEO Automation Dashboard

Hiring assessment for **AI Developer & Automation Engineer** at Edgelink Technology.

An admin queues a website audit. BullMQ hands the job to a worker. The worker crawls the site, collects mocked search signals, asks an AI model for a structured report, saves it in Postgres, writes a PDF, and logs mocked WhatsApp and email notifications.

```
TRIGGER (admin click or GET /api/cron/audits)
        |
        v
BullMQ queue: seo-audit-jobs
        |
        v
Worker (or cron fallback) calls runAudit(auditId)
        |-- Crawl homepage (sample HTML when USE_MOCKS=true or the fetch fails)
        |-- PageSpeed Insights          (mock)
        |-- Google Search Console       (mock)
        |-- Schema.org validation
        |-- On-page analysis
        |-- robots.txt + sitemap.xml
        |-- DataForSEO rankings         (mock)
        v
AI analysis -> JSON recommendations
        |
        v
Postgres Audit row (signals, result, score, pdfPath)
        |
        v
PDF in REPORTS_DIR + Notification rows (WhatsApp + email mocks)
```

## Live URL

Not deployed yet. Deploy steps are at the bottom. After deploy, put the public URL and the admin password here.

Local test login (already written into `.env` for this machine):

- Username: `admin`
- Password: `admin123`

Change `ADMIN_PASSWORD` before you publish the repo or the live app, and put the live password in this section after deploy.

## Local setup

```bash
cd seoauto
npm install
cp .env.example .env
```

Fill `DATABASE_URL` (Supabase pooler, port 6543) and `REDIS_URL` (`rediss://...`). Encode any `@` in the database password as `%40`.

```bash
npx prisma contract emit
npx prisma db init
npm run seed
npm run dev
npm run worker
```

Open `http://localhost:3000`, sign in at `/admin`, and click **Run audit** on Example Dental Clinic.

`npx tsx scripts/run-mock-audit.ts` runs one audit in-process, without Redis, and prints the score, PDF path, and notification rows.

`npm run seed` inserts three clients if they are not already there:

- Example Dental Clinic
- Pune Nest Realty
- Kothrud Smile Studio

## USE_MOCKS

`src/mocks/index.js` is the switch:

```js
const USE_MOCKS = process.env.USE_MOCKS === 'true';
```

When it is `true`:

- PageSpeed, Search Console, and DataForSEO return the files in `src/mocks/`
- The homepage crawl uses `src/mocks/sample-page.html` (missing meta description, two H1s, images without alt, no schema)
- robots/sitemap checks return a fixed technical report
- AI returns `src/mocks/claude.mock.js` and does not call a model
- WhatsApp uses `src/mocks/twilio.mock.js` (`console.log`)
- Email is also `console.log`
- A real PDF is still written

Set `USE_MOCKS=false` to crawl the live URL. AI then uses Claude `claude-sonnet-4-6` when `ANTHROPIC_API_KEY` is set. If that key is empty, the Claude mock is returned so the pipeline still finishes. PageSpeed, Search Console, and DataForSEO throw until those APIs are implemented. Their real request shapes are commented in `src/crawlers/`.

## API

| Route | Behaviour |
|---|---|
| `POST /api/audit` | Admin cookie required. Body `{ clientId }`. Creates a `QUEUED` audit, enqueues `run-audit`, returns `202 { auditId }`. |
| `GET /api/audit/[id]` | Status, progress, scores, result, signals, notifications. |
| `GET /api/audit/[id]/pdf` | Downloads the generated PDF. |
| `GET /api/cron/audits` | Requires header `x-cron-secret` or `Authorization: Bearer <CRON_SECRET>`. Enqueues clients with no audit in 30 days. If `FALLBACK_PROCESS=true`, runs one queued audit inside the request. |
| `POST /api/login` | Sets the admin cookie from `ADMIN_USER` / `ADMIN_PASSWORD`. |

Routes only enqueue or read, except the cron fallback, which runs one audit. Keep `FALLBACK_PROCESS=false` while `npm run worker` is running.

## Deployment

1. Postgres: Supabase or Neon. This repo uses Prisma ORM 8 (`src/prisma/contract.prisma`), not a Prisma 7 `schema.prisma`. On the host, `npx prisma contract emit` then `npx prisma db init`, then `npm run seed`.
2. Upstash Redis: `REDIS_URL` must be `rediss://`.
3. Vercel: import `seoauto`, set every key from `.env.example`, set `USE_MOCKS=true`. Set `FALLBACK_PROCESS=true` only if you are not hosting the worker.
4. Worker: Render, Railway, or Fly. Start command `npm run worker`. Same `DATABASE_URL`, `REDIS_URL`, `USE_MOCKS`, and `REPORTS_DIR`. The worker is not a Vercel function.
5. cron-job.org: every minute, `GET https://<app>.vercel.app/api/cron/audits` with header `x-cron-secret: <CRON_SECRET>`.
6. Supabase free projects pause after 7 days. Point a second cron-job.org ping at `/api/health`.
7. PDF files live on the machine that runs `runAudit`. If the worker host generates the PDF, the Vercel download route can only serve it when both sides share `REPORTS_DIR` (or you set `FALLBACK_PROCESS=true` so Vercel generates the file). For a split deploy, generate PDFs on the host that also serves `GET /api/audit/[id]/pdf`, or switch the fallback on.

## Assumptions

- Next.js 16 and Prisma ORM 8 stay in place. The assessment's Next 14 / classic Prisma shape is mapped onto this app's working database client.
- UI is Tailwind. shadcn was not added, so the Next 16 and Tailwind 4 setup stays untouched.
- PDFs use `pdf-lib` so a file is produced without Puppeteer or Chrome.
- The Claude mock is the dental report from the brief. In mock mode every client receives that JSON. Signals still come from the sample page.
- `DIRECT_URL` is listed for the assessment env template. Prisma ORM 8 connects with `DATABASE_URL` only.
- Worker idle polling uses BullMQ `drainDelay: 30` (seconds) so Upstash is not polled in a tight loop.

## Video checklist

1. Show `USE_MOCKS=true` in the environment and the amber banner in the app.
2. Sign in to `/admin` and click **Run audit** on Example Dental Clinic.
3. Show the worker log: job picked up, mock WhatsApp lines, mock email lines, completed.
4. Show the admin progress bar moving through the steps, then the detail page with score 64, recommendations, raw signals, and two notification rows.
5. Download the PDF.
6. Open `/dashboard/<clientId>` and show the same score, breakdown, and quick wins.
7. Call `/api/cron/audits` without the secret and show 401. Call it with `x-cron-secret` and show the JSON.

## Submission email

To: hr@edgelinktechnology.com
Subject: `Technical Assessment — AI Developer — [Full Name]`

```
Hello,

Please find my SEO Automation Dashboard assessment.

GitHub: [repo URL]
Live app: [deployed URL]
Walkthrough: [Loom or Drive link]

Admin login
Username: admin
Password: [ADMIN_PASSWORD]

USE_MOCKS is on, so a reviewer can run an audit without agency API keys.
The worker processes queue seo-audit-jobs. Postgres stores the audit,
the PDF downloads from the audit page, and WhatsApp/email are mocked.

Thank you,
[Full Name]
```
