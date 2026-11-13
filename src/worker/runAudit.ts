import { db } from '../prisma/db';
import { crawlSite } from '../crawlers/crawl';
import { getGSC, getPageSpeed, getRankings } from '../crawlers/integrations';
import { analyseOnPage } from '../crawlers/onpage';
import { validateSchema } from '../crawlers/schema';
import { checkRobotsSitemap } from '../crawlers/technical';
import { analyse } from '../ai/analyse';
import { notify } from '../notify';
import { generatePdf } from '../report/pdf';

async function step(
  id: string,
  progress: number,
  currentStep: string,
  extra: {
    signals?: object;
    result?: object;
    overallScore?: number;
    scoreBreakdown?: object;
  } = {},
) {
  await db.orm.public.Audit.where({ id }).update({
    status: 'RUNNING',
    progress,
    currentStep,
    ...extra,
  } as never);
}

export async function runAudit(auditId: string) {
  try {
    const audit = await db.orm.public.Audit.where({ id: auditId })
      .include('client', (client) => client)
      .first();

    if (!audit?.client) {
      throw new Error('Audit or client not found');
    }

    const { client } = audit;
    await step(auditId, 5, 'Crawling website');
    const crawl = await crawlSite(client.websiteUrl);

    await step(auditId, 20, 'PageSpeed Insights');
    const cwv = await getPageSpeed(client.websiteUrl);

    await step(auditId, 30, 'Search Console');
    const gsc = await getGSC(client.websiteUrl);

    await step(auditId, 40, 'Schema validation');
    const schema = validateSchema(crawl.$);

    await step(auditId, 50, 'On-page analysis');
    const onPage = analyseOnPage(crawl.$, crawl.url);

    await step(auditId, 58, 'robots.txt & sitemap');
    const technical = await checkRobotsSitemap(client.websiteUrl);

    await step(auditId, 65, 'Keyword rankings');
    const rankings = await getRankings(
      client.websiteUrl,
      `${client.businessType} ${client.city}`,
    );

    const signals = {
      onPage,
      technical,
      cwv,
      schema,
      gsc,
      rankings,
      crawl: {
        url: crawl.url,
        status: crawl.status,
        loadTimeMs: crawl.loadTimeMs,
        usedSample: crawl.usedSample,
      },
    };

    await step(auditId, 72, 'AI analysis (Claude)', { signals });
    const result = await analyse({ client, signals });

    await step(auditId, 85, 'Saving results', {
      result,
      overallScore: result.overall_score,
      scoreBreakdown: result.score_breakdown,
    });

    await step(auditId, 92, 'Generating PDF');
    let pdfPath = `on-demand:${auditId}`;
    try {
      pdfPath = await generatePdf({ client, auditId, result });
    } catch (pdfError) {
      console.warn('[PDF] saved in the database only. Download rebuilds it.', pdfError);
    }
    await db.orm.public.Audit.where({ id: auditId }).update({ pdfPath });

    await step(auditId, 98, 'Sending notifications');
    await notify({
      auditId,
      client,
      pdfPath,
      score: result.overall_score,
    });

    await db.orm.public.Audit.where({ id: auditId }).update({
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'Completed',
      completedAt: new Date(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[AUDIT FAILED]', message);
    try {
      await db.orm.public.Audit.where({ id: auditId }).update({
        status: 'FAILED',
        errorMessage: message,
      });
    } catch (updateError) {
      console.error('[AUDIT FAILED] could not save error', updateError);
    }
    throw error;
  }
}
