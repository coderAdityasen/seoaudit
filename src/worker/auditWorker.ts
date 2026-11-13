import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { db } from '../../src/prisma/db';
import { USE_MOCKS } from '../mock';
import { pageSpeedMock } from '../mock/pagespeed.mock';
import { gscMock } from '../mock/gsc.mock';
import { dataForSeoMock } from '../mock/dataforseo.mock';
import { sendWhatsApp } from '../mock/twilio.mock';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is missing in .env file");
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
   enableReadyCheck: false,
});

// Mock Crawler & Analyzer Functions
async function getPageSpeedData(url: string) {
 if (USE_MOCKS) return pageSpeedMock;
  throw new Error('API is not implemented yet');
}

async function getGSCData(url: string) {
  if (USE_MOCKS) return gscMock;
  throw new Error('API is not implemented yet');
}

async function getDataForSEO(url: string) {
  if (USE_MOCKS) return dataForSeoMock;
  throw new Error('API is not implemented yet');
}

async function getGeminiAnalysis(data: any, auditClient: any) {
  if (USE_MOCKS) {
    return {
      audit_version: "v1.0",
      overall_score: 75,
      score_breakdown: { technical: 80, on_page: 70, content: 65, core_web_vitals: 60, schema: 90 },
      critical_issues: ["LCP is high", "Missing local schema"],
      important_issues: ["H1 missing on services page"],
      quick_wins: ["Add meta description"],
      recommendations: [
        {
          priority: "CRITICAL",
          category: "CWV",
          finding: "Largest Contentful Paint is 4.2s",
          fix: "Optimize hero images",
          estimated_impact: "High",
          effort: "Hours",
          falsifiability_check: "Run PageSpeed Insights and check if LCP < 2.5s"
        }
      ],
      executive_summary: "Site requires technical optimization and core web vitals improvements."
    };
  }

  // System Prompt strictly from the assessment document
  const systemInstruction = `You are a senior SEO analyst with 15+ years experience specialising in Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only - no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low), effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

  // User Prompt mapped with actual client and crawled data
  const userPrompt = `Analyse the following SEO signals for: ${auditClient.websiteUrl}
Business type: ${auditClient.businessType}
Business location: ${auditClient.city}, ${auditClient.state}, India

=== ON-PAGE DATA ===
${JSON.stringify(data.onPageData)}

=== TECHNICAL DATA ===
${JSON.stringify(data.technicalData)}

=== CORE WEB VITALS ===
${JSON.stringify(data.speedData)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(data.schemaData)}

=== GOOGLE SEARCH CONSOLE ===
${JSON.stringify(data.searchConsoleData)}

=== KEYWORD RANKINGS ===
${JSON.stringify(data.rankingsData)}

Respond ONLY with this JSON structure - no other text:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100>,
  "score_breakdown": { "technical": <0-100>, "on_page": <0-100>, "content": <0-100>, "core_web_vitals": <0-100>, "schema": <0-100> },
  "critical_issues": [<max 5 items>],
  "important_issues": [<max 8 items>],
  "quick_wins": [<max 5 items effort <= 2 hours>],
  "recommendations": [{
    "priority": "CRITICAL | HIGH | MEDIUM | LOW",
    "category": "Technical | OnPage | Content | Schema | CWV",
    "finding": "<what is wrong>",
    "fix": "<exact action to take>",
    "estimated_impact": "High | Medium | Low",
    "effort": "Hours | Days | Weeks",
    "falsifiability_check": "<how to verify this worked>"
  }],
  "executive_summary": "<3 sentences max, plain English>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2 // Lower temperature for structured, factual output
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

const processAuditJob = async (job: Job) => {
  const { auditId } = job.data;
  console.log(`Job pick kar liya: ${auditId}`);

  try {
    
    const audit = await db.orm.public.Audit
      .include("client", (c) => c) // include relation via chain
      .first({ id: auditId }); // findUnique → .first({ id })

    if (!audit || !audit.client) {
      throw new Error("Audit or Client not found in DB");
    }

    const targetUrl = audit.client.websiteUrl;

    // Status update: RUNNING (Prisma 8 fluent update)
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        status: 'RUNNING',
        progress: 10,
        currentStep: 'Crawling URL',
      });

    // Step 1: Fetch + Cheerio URL crawl
    console.log(`[Worker] Crawling URL: ${targetUrl}`);
    const onPageData = {
      title: "Extracted Title",
      meta: "Extracted Meta",
      h1: "Main Heading",
    }; // Placeholder

    // Step 2 & 3: External data
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        progress: 30,
        currentStep: 'Fetching External Data',
      });
    const speedData = await getPageSpeedData(targetUrl);
    const searchConsoleData = await getGSCData(targetUrl);

    // Step 4, 5 & 6: Technical checks
    const technicalData = { sitemap: true, robots: true, ssl: true };
    const schemaData = { hasLocalBusiness: false };

    // Step 7: DataForSEO rankings
    const rankingsData = await getDataForSEO(targetUrl);

    // Step 8: AI Analysis
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        progress: 60,
        currentStep: 'AI Analysis',
      });

    const aggregatedData = {
      onPageData,
      technicalData,
      speedData,
      schemaData,
      searchConsoleData,
      rankingsData,
    };

    const aiResult = await getGeminiAnalysis(aggregatedData, audit.client);

    // Step 9: Save AI result
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        progress: 80,
        currentStep: 'Generating PDF',
        overallScore: aiResult.overall_score,
        scoreBreakdown: aiResult.score_breakdown,
        result: aiResult,
        signals: aggregatedData,
      });

    // Step 10: Puppeteer PDF Report Generation (TODO)
    const mockPdfPath = `/tmp/reports/${auditId}.pdf`;

    // Step 11: WhatsApp notification
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        progress: 90,
        currentStep: 'Sending Notifications',
        pdfPath: mockPdfPath,
      });
    await sendWhatsApp(audit.clientId, mockPdfPath, aiResult.overall_score);

    // Audit Complete
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        status: 'COMPLETED',
        progress: 100,
        currentStep: 'Done',
        completedAt: new Date(),
      });

    console.log(`[Worker] Job ${auditId} successfully complete ho gaya!`);
  } catch (error: any) {
    console.error(`[Worker] Job ${auditId} fail ho gaya:`, error);
    await db.orm.public.Audit
      .where({ id: auditId })
      .update({
        status: 'FAILED',
        errorMessage: error.message || 'Unknown error',
      });
    throw error;
  
  }
};

export const auditWorker = new Worker('seo-audit-jobs', processAuditJob, { connection });

auditWorker.on('ready', () => {
  console.log('Worker start ho gaya hai aur jobs ka wait kar raha hai...');
});

auditWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} error ke sath fail hua: ${err.message}`);
});