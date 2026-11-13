import { Suspense } from 'react';
import ClientDashboardPage from './dashboard-client';

export const instant = false;

export default function Page({ params }: { params: Promise<{ clientId: string }> }) {
  return (
    <Suspense fallback={<main className="p-8">Loading dashboard...</main>}>
      <ClientDashboardPage params={params} />
    </Suspense>
  );
}
