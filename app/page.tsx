'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ClientRow = {
  id: string;
  name: string;
  websiteUrl: string;
  businessType: string;
  city: string;
};

export default function HomePage() {
  const [clients, setClients] = useState<ClientRow[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then((response) => response.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium text-teal-800">Edgelink Technology</p>
        <h1 className="text-4xl font-semibold tracking-tight">SEO Automation Dashboard</h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Queue a website audit, watch each crawl step, store the AI recommendations, and download the PDF report.
        </p>
        <Link href="/admin" className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Open admin portal
        </Link>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/dashboard/${client.id}`}
            className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <h2 className="text-lg font-semibold">{client.name}</h2>
            <p className="text-sm text-zinc-500">
              {client.businessType} · {client.city}
            </p>
            <p className="mt-2 text-sm text-zinc-600">{client.websiteUrl}</p>
          </Link>
        ))}
        {clients.length === 0 && (
          <p className="text-sm text-zinc-500">No clients yet. Sign in to the admin portal and add one, or run the seed script.</p>
        )}
      </section>
    </main>
  );
}
