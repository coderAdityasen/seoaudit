import { USE_MOCKS } from '../mocks/runtime';
import type { TechnicalReport } from '../types/audit';

const USER_AGENT = 'Mozilla/5.0 (compatible; EdgelinkSEOAudit/1.0)';

const MOCK_TECHNICAL: TechnicalReport = {
  robotsFound: true,
  robotsBlocksAll: false,
  sitemapDeclared: true,
  sitemapFound: true,
  sitemapUrlCount: 8,
  https: true,
};

async function fetchText(url: URL) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) return null;
  const body = (await response.text()).trim();
  if (!body || /^<!doctype html|^<html/i.test(body)) return null;
  return body;
}

function countSitemapUrls(body: string) {
  const matches = body.match(/<url\b|<sitemap\b/gi);
  return matches?.length ?? 0;
}

export async function checkRobotsSitemap(websiteUrl: string): Promise<TechnicalReport> {
  let https = false;
  try {
    https = new URL(websiteUrl).protocol === 'https:';
  } catch {
    https = websiteUrl.startsWith('https://');
  }

  if (USE_MOCKS) {
    return { ...MOCK_TECHNICAL, https };
  }

  try {
    const pageUrl = new URL(websiteUrl);
    const robotsBody = await fetchText(new URL('/robots.txt', pageUrl.origin)).catch(() => null);
    const robotsFound = Boolean(robotsBody);
    const robotsBlocksAll = Boolean(
      robotsBody && /user-agent:\s*\*/i.test(robotsBody) && /disallow:\s*\/\s*$/im.test(robotsBody),
    );
    const sitemapLine = robotsBody
      ?.split(/\r?\n/)
      .find((line) => /^\s*sitemap\s*:/i.test(line));
    const sitemapDeclared = Boolean(sitemapLine);
    const sitemapTarget = sitemapLine
      ? sitemapLine.split(':').slice(1).join(':').trim()
      : new URL('/sitemap.xml', pageUrl.origin).toString();

    let sitemapBody: string | null = null;
    try {
      sitemapBody = await fetchText(new URL(sitemapTarget, pageUrl.origin));
    } catch {
      sitemapBody = null;
    }

    const sitemapFound = Boolean(
      sitemapBody && /<(urlset|sitemapindex)\b/i.test(sitemapBody),
    );

    return {
      robotsFound,
      robotsBlocksAll,
      sitemapDeclared,
      sitemapFound,
      sitemapUrlCount: sitemapBody && sitemapFound ? countSitemapUrls(sitemapBody) : 0,
      https,
    };
  } catch (error) {
    console.warn('[TECHNICAL] check failed:', error);
    return {
      robotsFound: false,
      robotsBlocksAll: false,
      sitemapDeclared: false,
      sitemapFound: false,
      sitemapUrlCount: 0,
      https,
    };
  }
}
