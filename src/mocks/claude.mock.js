module.exports = {
  audit_version: 'v1.0',
  overall_score: 64,
  score_breakdown: { technical: 68, on_page: 58, content: 60, core_web_vitals: 61, schema: 40 },
  critical_issues: [
    'No LocalBusiness/Dentist schema markup found on the homepage',
    'Largest Contentful Paint is 4.2s on mobile (target < 2.5s)',
    '3 index coverage errors reported in Google Search Console'
  ],
  important_issues: [
    'Meta description missing on homepage',
    'Two H1 tags on the homepage',
    '420 KiB of unused JavaScript',
    '2 render-blocking resources',
    'Average position 6–11 for core Pune dental keywords — below the fold of page 1',
    'Several images missing alt text'
  ],
  quick_wins: [
    'Add a 150–160 character meta description to the homepage',
    'Keep a single H1 and demote the second to H2',
    'Add alt text to all images',
    'Defer or inline the 2 render-blocking resources'
  ],
  recommendations: [
    {
      priority: 'CRITICAL', category: 'Schema',
      finding: 'No structured data detected; the clinic is not eligible for rich results or strong local signals.',
      fix: 'Add JSON-LD of type Dentist with name, address, telephone, openingHours, geo and sameAs.',
      estimated_impact: 'High', effort: 'Hours',
      falsifiability_check: 'Google Rich Results Test passes and "Dentist" appears in GSC Enhancements within 2–4 weeks.'
    },
    {
      priority: 'CRITICAL', category: 'CWV',
      finding: 'Mobile LCP is 4.2s (poor); INP is 280ms (needs improvement).',
      fix: 'Compress and preload the hero image (WebP/AVIF), remove unused JS, defer non-critical scripts.',
      estimated_impact: 'High', effort: 'Days',
      falsifiability_check: 'PageSpeed mobile LCP < 2.5s and performance score ≥ 85 on re-test.'
    },
    {
      priority: 'HIGH', category: 'Technical',
      finding: 'GSC reports 3 index coverage errors.',
      fix: 'Open GSC → Pages report, fix the affected URLs (404/redirect/noindex), and request re-indexing.',
      estimated_impact: 'Medium', effort: 'Hours',
      falsifiability_check: 'Index coverage errors drop to 0 in GSC within 14 days.'
    },
    {
      priority: 'HIGH', category: 'OnPage',
      finding: 'Homepage has no meta description and two H1s.',
      fix: 'Write a unique meta description including "dental clinic in Pune"; keep exactly one H1.',
      estimated_impact: 'Medium', effort: 'Hours',
      falsifiability_check: 'CTR for "dental clinic in pune" rises above 5% in GSC over the next 30 days.'
    },
    {
      priority: 'MEDIUM', category: 'Content',
      finding: '"dental implants cost pune" ranks at position 11.3 with 310 impressions — just off page 1.',
      fix: 'Publish a dedicated implants-cost page (800+ words, pricing ranges, FAQs, local schema).',
      estimated_impact: 'Medium', effort: 'Days',
      falsifiability_check: 'Position improves to ≤ 8 within 60 days per GSC.'
    }
  ],
  executive_summary: 'The site has a solid SEO foundation but is held back by slow mobile load times and missing local schema markup. Fixing the on-page basics and Core Web Vitals should lift rankings for core Pune dental searches. Most quick wins can be completed in a day or two.'
};
