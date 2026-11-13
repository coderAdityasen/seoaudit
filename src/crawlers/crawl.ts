import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { USE_MOCKS } from '../mocks/runtime';

const SAMPLE_PAGE = path.join(process.cwd(), 'src', 'mocks', 'sample-page.html');
const USER_AGENT = 'Mozilla/5.0 (compatible; EdgelinkSEOAudit/1.0)';

export type CrawlResult = {
  url: string;
  status: number;
  html: string;
  $: cheerio.CheerioAPI;
  loadTimeMs: number;
  usedSample: boolean;
};

async function loadSample(url: string, started: number): Promise<CrawlResult> {
  const html = await readFile(SAMPLE_PAGE, 'utf8');
  return {
    url,
    status: 200,
    html,
    $: cheerio.load(html),
    loadTimeMs: Date.now() - started,
    usedSample: true,
  };
}

export async function crawlSite(url: string): Promise<CrawlResult> {
  const started = Date.now();
  if (USE_MOCKS) return loadSample(url, started);

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Only http and https URLs can be crawled: ${url}`);
    }

    const response = await fetch(parsed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Crawl failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return {
      url: response.url || url,
      status: response.status,
      html,
      $: cheerio.load(html),
      loadTimeMs: Date.now() - started,
      usedSample: false,
    };
  } catch (error) {
    console.warn('[CRAWL] live fetch failed, using sample HTML:', error);
    return loadSample(url, started);
  }
}
