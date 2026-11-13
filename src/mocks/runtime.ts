import mocks from './index.js';
import pageSpeedData from './pagespeed.mock.js';
import gscData from './gsc.mock.js';
import rankingsData from './dataforseo.mock.js';
import claudeData from './claude.mock.js';
import twilio from './twilio.mock.js';

function unwrap<T>(mod: T): T {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: T }).default;
  }
  return mod;
}

const mockSwitch = unwrap(mocks) as { USE_MOCKS?: boolean; default?: { USE_MOCKS: boolean } };

export const USE_MOCKS = Boolean(mockSwitch.USE_MOCKS ?? mockSwitch.default?.USE_MOCKS);

export const pageSpeedMock = unwrap(pageSpeedData);
export const gscMock = unwrap(gscData);
export const dataForSeoMock = unwrap(rankingsData);
export const claudeMock = unwrap(claudeData);

const twilioApi = unwrap(twilio) as {
  sendWhatsApp?: (clientId: string, pdfPath: string, score: number) => Promise<{ status: string; sid: string }>;
  default?: {
    sendWhatsApp: (clientId: string, pdfPath: string, score: number) => Promise<{ status: string; sid: string }>;
  };
};

export const sendWhatsApp = (twilioApi.sendWhatsApp || twilioApi.default?.sendWhatsApp) as (
  clientId: string,
  pdfPath: string,
  score: number,
) => Promise<{ status: string; sid: string }>;
