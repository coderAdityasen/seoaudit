import type { CheerioAPI } from 'cheerio';
import type { OnPageReport } from '../types/audit';

function clean(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function analyseOnPage($: CheerioAPI, pageUrl: string): OnPageReport {
  const title = clean($('title').first().text());
  const meta = clean($('meta[name="description"]').attr('content'));
  const h1Texts = $('h1')
    .toArray()
    .map((element) => clean($(element).text()))
    .filter(Boolean);
  const h2Texts = $('h2')
    .toArray()
    .map((element) => clean($(element).text()))
    .filter(Boolean);

  const images = $('img').toArray();
  const missingAlt = images.filter((element) => !clean($(element).attr('alt'))).length;
  const wordCount = clean($('body').text()).split(/\s+/).filter(Boolean).length;

  let host = '';
  try {
    host = new URL(pageUrl).hostname;
  } catch {
    host = '';
  }

  let internal = 0;
  let external = 0;
  $('a[href]').each((_, element) => {
    const href = clean($(element).attr('href'));
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    try {
      const resolved = new URL(href, pageUrl || 'https://example.com');
      if (host && resolved.hostname === host) internal += 1;
      else external += 1;
    } catch {
      internal += 1;
    }
  });

  return {
    title: { text: title, length: title.length, present: title.length > 0 },
    metaDescription: { text: meta, length: meta.length, present: meta.length > 0 },
    h1: { count: h1Texts.length, texts: h1Texts },
    h2: { count: h2Texts.length, texts: h2Texts },
    images: { total: images.length, missingAlt },
    wordCount,
    links: { internal, external },
    canonical: clean($('link[rel="canonical"]').attr('href')) || null,
    viewport: clean($('meta[name="viewport"]').attr('content')) || null,
    openGraph: {
      title: clean($('meta[property="og:title"]').attr('content')) || null,
      description: clean($('meta[property="og:description"]').attr('content')) || null,
      image: clean($('meta[property="og:image"]').attr('content')) || null,
    },
    lang: clean($('html').attr('lang')) || null,
  };
}
