import { claudeMock, USE_MOCKS } from '../mocks/runtime';
import type { AuditResult } from '../types/audit';

const SYSTEM_PROMPT = `You are a senior SEO analyst with 15+ years experience specialising in
Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only — no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low),
effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

type ClientContext = {
  websiteUrl: string;
  businessType: string;
  city: string;
  state: string;
};

type Signals = {
  onPage: unknown;
  technical: unknown;
  cwv: unknown;
  schema: unknown;
  gsc: unknown;
  rankings: unknown;
};

function buildUserPrompt(client: ClientContext, signals: Signals) {
  return `Analyse the following SEO signals for: ${client.websiteUrl}
Business type: ${client.businessType}
Business location: ${client.city}, ${client.state}, India

=== ON-PAGE DATA ===
${JSON.stringify(signals.onPage)}

=== TECHNICAL DATA ===
${JSON.stringify(signals.technical)}

=== CORE WEB VITALS ===
${JSON.stringify(signals.cwv)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(signals.schema)}

=== GOOGLE SEARCH CONSOLE ===
${JSON.stringify(signals.gsc)}

=== KEYWORD RANKINGS ===
${JSON.stringify(signals.rankings)}

Respond ONLY with this JSON structure — no other text:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100>,
  "score_breakdown": { "technical": <0-100>, "on_page": <0-100>,
                       "content": <0-100>, "core_web_vitals": <0-100>,
                       "schema": <0-100> },
  "critical_issues": [<max 5 items>],
  "important_issues": [<max 8 items>],
  "quick_wins": [<max 5 items — effort <= 2 hours>],
  "recommendations": [{
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "category": "Technical|OnPage|Content|Schema|CWV",
    "finding": "<what is wrong>",
    "fix": "<exact action to take>",
    "estimated_impact": "High|Medium|Low",
    "effort": "Hours|Days|Weeks",
    "falsifiability_check": "<how to verify this worked>"
  }],
  "executive_summary": "<3 sentences max, plain English>"
}`;
}

function parseResult(text: string): AuditResult | null {
  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim()) as AuditResult;
    if (typeof json.overall_score === 'number' && Array.isArray(json.recommendations)) {
      return json;
    }
  } catch {
    return null;
  }
  return null;
}

async function analyseWithClaude(client: ClientContext, signals: Signals) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(client, signals) }],
    });
    const text = msg.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');
    const parsed = parseResult(text);
    if (parsed) return parsed;
  }

  throw new Error('Claude returned invalid JSON twice');
}

export async function analyse({
  client,
  signals,
}: {
  client: ClientContext;
  signals: Signals;
}): Promise<AuditResult> {
  if (USE_MOCKS || !process.env.ANTHROPIC_API_KEY) {
    return claudeMock as AuditResult;
  }

  return analyseWithClaude(client, signals);
}
