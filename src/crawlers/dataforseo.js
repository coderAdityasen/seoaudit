// src/crawlers/dataforseo.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');

async function getRankings(url, keyword) {
  if (USE_MOCKS) return mockData;
  // Real DataForSEO rankings call goes here for `keyword` on `url`
  void url;
  void keyword;
  throw new Error('DataForSEO API is not configured. Set USE_MOCKS=true.');
}

module.exports = { getRankings };
