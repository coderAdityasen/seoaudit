// src/crawlers/pagespeed.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/pagespeed.mock');

async function getPageSpeed(url) {
  if (USE_MOCKS) return mockData;
  // Real PageSpeed Insights API call goes here
  // GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&strategy=mobile&category=performance&category=seo&category=accessibility&key=$PSI_KEY
  void url;
  throw new Error('PageSpeed Insights API is not configured. Set USE_MOCKS=true.');
}

module.exports = { getPageSpeed };
