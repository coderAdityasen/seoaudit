import { Suspense } from 'react';
import AuditDetailPage from './detail-client';

export const instant = false;

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="p-8">Loading audit...</main>}>
      <AuditDetailPage params={params} />
    </Suspense>
  );
}
