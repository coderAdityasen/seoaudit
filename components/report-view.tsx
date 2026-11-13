'use client';

import type { AuditResult } from '@/src/types/audit';

type TrendPoint = {
  id: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
};

function asResult(value: unknown): AuditResult | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as AuditResult;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value as AuditResult;
  return null;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-red-700';
}

function ringColor(score: number) {
  if (score >= 80) return '#047857';
  if (score >= 50) return '#b45309';
  return '#b91c1c';
}

export function ScoreRing({ score }: { score: number }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{ background: `conic-gradient(${ringColor(score)} ${degrees}deg, #e4e4e7 0deg)` }}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
        <div className="text-center">
          <div className={`text-4xl font-semibold ${scoreColor(score)}`}>{score}</div>
          <div className="text-xs text-zinc-500">out of 100</div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: 'bg-zinc-200 text-zinc-800',
    RUNNING: 'bg-sky-100 text-sky-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || styles.QUEUED}`}>
      {status}
    </span>
  );
}

export function ReportView({
  clientName,
  websiteUrl,
  businessType,
  city,
  state,
  overallScore,
  scoreBreakdown,
  result,
  pdfHref,
  trend = [],
}: {
  clientName: string;
  websiteUrl: string;
  businessType?: string;
  city?: string;
  state?: string;
  overallScore: number | null;
  scoreBreakdown: unknown;
  result: unknown;
  pdfHref?: string | null;
  trend?: TrendPoint[];
}) {
  const report = asResult(result);
  const breakdown =
    scoreBreakdown && typeof scoreBreakdown === 'object'
      ? (scoreBreakdown as Record<string, number>)
      : report?.score_breakdown;
  const score = overallScore ?? report?.overall_score ?? 0;
  const scoredTrend = trend.filter((item) => typeof item.overallScore === 'number');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <p className="text-sm text-zinc-500">Client report</p>
          <h1 className="text-2xl font-semibold text-zinc-900">{clientName}</h1>
          <p className="mt-1 text-sm text-zinc-600">{websiteUrl}</p>
          {businessType && (
            <p className="text-sm text-zinc-500">
              {businessType}
              {city ? ` · ${city}` : ''}
              {state ? `, ${state}` : ''}
            </p>
          )}
        </div>
        {pdfHref && (
          <a
            href={pdfHref}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Download PDF report
          </a>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-6">
          <ScoreRing score={score} />
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Score breakdown</h2>
          <div className="mt-4 space-y-3">
            {breakdown &&
              Object.entries(breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-zinc-600">{key.replaceAll('_', ' ')}</span>
                    <span className="font-medium">{value}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200">
                    <div
                      className="h-2 rounded-full bg-teal-700"
                      style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {scoredTrend.length > 1 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Score trend</h2>
          <div className="mt-4 flex items-end gap-3">
            {scoredTrend
              .slice()
              .reverse()
              .map((item) => (
                <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end rounded bg-zinc-100">
                    <div
                      className="w-full rounded bg-teal-700"
                      style={{ height: `${item.overallScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">{item.overallScore}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {report?.executive_summary && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Executive summary</h2>
          <p className="mt-2 leading-7 text-zinc-700">{report.executive_summary}</p>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <IssueList title="Critical issues" items={report?.critical_issues || []} />
        <IssueList title="Quick wins" items={report?.quick_wins || []} />
      </section>

      {(report?.important_issues?.length || 0) > 0 && (
        <IssueList title="Important issues" items={report?.important_issues || []} />
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-200 px-6 py-4 text-lg font-semibold">Recommendations</h2>
        <div className="divide-y divide-zinc-200">
          {(report?.recommendations || []).map((item, index) => (
            <article key={`${item.priority}-${index}`} className="space-y-2 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                  {item.priority}
                </span>
                <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                  {item.category}
                </span>
                <span className="rounded bg-teal-50 px-2 py-1 text-xs text-teal-800">
                  Impact {item.estimated_impact}
                </span>
                <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  Effort {item.effort}
                </span>
              </div>
              <p className="text-sm text-zinc-800">{item.finding}</p>
              <p className="text-sm text-zinc-600">Fix: {item.fix}</p>
              <p className="text-sm text-zinc-500">Check: {item.falsifiability_check}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">None recorded.</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
