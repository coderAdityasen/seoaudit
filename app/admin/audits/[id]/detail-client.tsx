'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReportView, StatusBadge } from '@/components/report-view';

type NotificationRow = {
  id: string;
  channel: string;
  status: string;
  providerId: string | null;
  createdAt: string;
};

type AuditDetail = {
  id: string;
  status: string;
  progress: number;
  currentStep: string | null;
  overallScore: number | null;
  scoreBreakdown: unknown;
  signals: unknown;
  result: unknown;
  pdfPath: string | null;
  errorMessage: string | null;
  triggeredBy: string;
  createdAt: string;
  completedAt: string | null;
  client?: {
    id: string;
    name: string;
    websiteUrl: string;
    businessType: string;
    city: string;
    state: string;
  } | null;
  notifications?: NotificationRow[];
};

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    let stop = false;

    async function tick() {
      const response = await fetch(`/api/audit/${id}`);
      if (!response.ok) {
        setMissing(true);
        return;
      }
      const data = await response.json();
      if (!stop) setAudit(data);
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        if (timer) window.clearInterval(timer);
      }
    }

    void tick();
    timer = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      stop = true;
      if (timer) window.clearInterval(timer);
    };
  }, [id]);

  if (missing) {
    return <main className="p-8">Audit not found.</main>;
  }

  if (!audit) {
    return <main className="p-8">Loading audit...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <Link href="/admin" className="text-sm text-teal-800">Back to admin</Link>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={audit.status} />
        <span className="text-sm text-zinc-500">{audit.currentStep} · {audit.progress}%</span>
        <span className="text-sm text-zinc-500">Triggered by {audit.triggeredBy}</span>
      </div>
      {audit.status === 'RUNNING' || audit.status === 'QUEUED' ? (
        <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-3 bg-teal-700" style={{ width: `${audit.progress || 0}%` }} />
        </div>
      ) : null}
      {audit.errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{audit.errorMessage}</p>
      )}
      {audit.client && (
        <ReportView
          clientName={audit.client.name}
          websiteUrl={audit.client.websiteUrl}
          businessType={audit.client.businessType}
          city={audit.client.city}
          state={audit.client.state}
          overallScore={audit.overallScore}
          scoreBreakdown={audit.scoreBreakdown}
          result={audit.result}
          pdfHref={audit.result ? `/api/audit/${audit.id}/pdf` : null}
        />
      )}
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {(audit.notifications || []).length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No notification rows yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {audit.notifications?.map((item) => (
              <li key={item.id}>
                {item.channel} · {item.status}
                {item.providerId ? ` · ${item.providerId}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
      <details className="rounded-lg border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Raw signals</summary>
        <pre className="mt-3 overflow-auto text-xs">{JSON.stringify(audit.signals, null, 2)}</pre>
      </details>
      <details className="rounded-lg border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Claude JSON</summary>
        <pre className="mt-3 overflow-auto text-xs">{JSON.stringify(audit.result, null, 2)}</pre>
      </details>
    </main>
  );
}
