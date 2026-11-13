import pagespeed from './pagespeed.js';
import gsc from './gsc.js';
import dataforseo from './dataforseo.js';

function unwrap<T>(mod: T): T {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: T }).default;
  }
  return mod;
}

const pageSpeedApi = unwrap(pagespeed) as {
  getPageSpeed: (url: string) => Promise<unknown>;
};
const gscApi = unwrap(gsc) as { getGSC: (url: string) => Promise<unknown> };
const rankingsApi = unwrap(dataforseo) as {
  getRankings: (url: string, keyword: string) => Promise<unknown>;
};

export const getPageSpeed = pageSpeedApi.getPageSpeed;
export const getGSC = gscApi.getGSC;
export const getRankings = rankingsApi.getRankings;
