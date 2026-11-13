'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ReportView, StatusBadge } from '@/components/report-view';

type AuditDetail = {
  id: string;
  status: string;
  progress: number;
  currentStep: string | null;
  overallScore: number | null;
  scoreBreakdown: unknown;
  result: unknown;
  pdfPath: string | null;
  errorMessage: string | null;
  client?: {
    id: string;
    name: string;
    websiteUrl: string;
    businessType: string;
    city: string;
    state: string;
  } | null;
};

function AuditByQuery() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('auditId');
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!auditId) return undefined;
    let stop = false;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/audit/${auditId}`);
      if (!response.ok) {
        setMissing(true);
        window.clearInterval(timer);
        return;
      }
      const data = await response.json();
      if (!stop) setAudit(data);
      if (data.status === 'COMPLETED' || data.status === 'FAILED') window.clearInterval(timer);
    }, 2000);

    fetch(`/api/audit/${auditId}`)
      .then(async (response) => {
        if (!response.ok) {
          setMissing(true);
          return;
        }
        setAudit(await response.json());
      })
      .catch(() => setMissing(true));

    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [auditId]);

  if (!auditId) {
    return <p className="text-red-700">Add an auditId query parameter, or open a client dashboard.</p>;
  }
  if (missing) return <p>Audit not found.</p>;
  if (!audit?.client) return <p>Loading audit report...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={audit.status} />
        <span className="text-sm text-zinc-500">{audit.currentStep} · {audit.progress}%</span>
        <Link href={`/dashboard/${audit.client.id}`} className="text-sm text-teal-800">
          Client dashboard
        </Link>
      </div>
      {audit.errorMessage && <p className="text-sm text-red-700">{audit.errorMessage}</p>}
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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<p>Loading audit report...</p>}>
        <AuditByQuery />
      </Suspense>
    </main>
  );
}
