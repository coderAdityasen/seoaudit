'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReportView, StatusBadge } from '@/components/report-view';

type AuditRow = {
  id: string;
  status: string;
  progress: number;
  currentStep: string | null;
  overallScore: number | null;
  scoreBreakdown: unknown;
  result: unknown;
  pdfPath: string | null;
  createdAt: string;
  errorMessage: string | null;
};

type Payload = {
  client: {
    id: string;
    name: string;
    websiteUrl: string;
    businessType: string;
    city: string;
    state: string;
  };
  audits: AuditRow[];
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    let stop = false;

    async function load() {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        setMissing(true);
        return;
      }
      const payload = (await response.json()) as Payload;
      if (stop) return;
      setData(payload);
      const latest = payload.audits[0];
      if (!latest || latest.status === 'COMPLETED' || latest.status === 'FAILED') {
        if (timer) window.clearInterval(timer);
      }
    }

    void load();
    timer = window.setInterval(() => {
      void load();
    }, 2000);

    return () => {
      stop = true;
      if (timer) window.clearInterval(timer);
    };
  }, [clientId]);

  if (missing) return <main className="p-8">Client not found.</main>;
  if (!data) return <main className="p-8">Loading dashboard...</main>;

  const latestCompleted = data.audits.find((audit) => audit.status === 'COMPLETED');
  const latest = data.audits[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-teal-800">All clients</Link>
      {latest && latest.status !== 'COMPLETED' && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <StatusBadge status={latest.status} />
            <span className="text-sm">{latest.currentStep || 'Waiting'} · {latest.progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-3 bg-teal-700" style={{ width: `${latest.progress || 0}%` }} />
          </div>
          {latest.errorMessage && <p className="mt-2 text-sm text-red-700">{latest.errorMessage}</p>}
        </section>
      )}
      {latestCompleted ? (
        <ReportView
          clientName={data.client.name}
          websiteUrl={data.client.websiteUrl}
          businessType={data.client.businessType}
          city={data.client.city}
          state={data.client.state}
          overallScore={latestCompleted.overallScore}
          scoreBreakdown={latestCompleted.scoreBreakdown}
          result={latestCompleted.result}
          pdfHref={latestCompleted.pdfPath ? `/api/audit/${latestCompleted.id}/pdf` : null}
          trend={data.audits.map((audit) => ({
            id: audit.id,
            status: audit.status,
            overallScore: audit.overallScore,
            createdAt: audit.createdAt,
          }))}
        />
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">{data.client.name}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            No completed audit yet. Run one from the admin portal for this client ({clientId}).
          </p>
        </section>
      )}
    </main>
  );
}
