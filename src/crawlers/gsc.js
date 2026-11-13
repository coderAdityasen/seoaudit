// src/crawlers/gsc.js
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');

async function getGSC(url) {
  if (USE_MOCKS) return mockData;
  // Real Google Search Console API call goes here
  void url;
  throw new Error('Google Search Console API is not configured. Set USE_MOCKS=true.');
}

module.exports = { getGSC };
