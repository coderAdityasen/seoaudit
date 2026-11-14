'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/report-view';

type ClientRow = {
  id: string;
  name: string;
  websiteUrl: string;
  businessType: string;
  city: string;
  state: string;
};

type AuditRow = {
  id: string;
  status: string;
  progress: number;
  currentStep: string | null;
  overallScore: number | null;
  triggeredBy: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  client?: { name?: string } | null;
};

const emptyClient = {
  name: '',
  websiteUrl: '',
  businessType: '',
  city: '',
  state: '',
  whatsapp: '',
  email: '',
};

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [form, setForm] = useState(emptyClient);
  const [message, setMessage] = useState('');
  const [active, setActive] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    const [clientResponse, auditResponse] = await Promise.all([
      fetch('/api/clients'),
      fetch('/api/audits'),
    ]);
    if (clientResponse.status === 401 || auditResponse.status === 401) {
      router.push('/login');
      return;
    }
    const clientData = await clientResponse.json();
    const auditData = await auditResponse.json();
    setClients(Array.isArray(clientData) ? clientData : []);
    setAudits(Array.isArray(auditData) ? auditData : []);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!active || active.status === 'COMPLETED' || active.status === 'FAILED') return undefined;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/audit/${active.id}`);
      const data = await response.json();
      setActive(data);
      setAudits((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        window.clearInterval(timer);
        load();
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, load]);

  async function runAudit(clientId: string) {
    setMessage('');
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Could not queue the audit');
      return;
    }
    setActive({
      id: data.auditId,
      status: 'QUEUED',
      progress: 0,
      currentStep: 'Queued',
      overallScore: null,
      triggeredBy: 'manual',
      errorMessage: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
    await load();
  }

  async function addClient(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Could not add the client');
      return;
    }
    setForm(emptyClient);
    load();
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">SEO Automation Admin</h1>
          <p className="text-sm text-zinc-500">Queue an audit and watch the worker update each step.</p>
        </div>
        <button onClick={logout} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          Log out
        </button>
      </header>

      {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>}

      {active && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-500">Live audit</p>
              <p className="font-medium">{active.currentStep || active.status}</p>
            </div>
            <StatusBadge status={active.status} />
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-3 bg-teal-700 transition-all" style={{ width: `${active.progress || 0}%` }} />
          </div>
          <p className="mt-2 text-sm text-zinc-600">{active.progress || 0}%</p>
          {active.errorMessage && <p className="mt-2 text-sm text-red-700">{active.errorMessage}</p>}
          <Link href={`/admin/audits/${active.id}`} className="mt-3 inline-block text-sm font-medium text-teal-800">
            Open audit detail
          </Link>
        </section>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Add client</h2>
        <form onSubmit={addClient} className="mt-4 grid gap-3 md:grid-cols-2">
          {(['name', 'websiteUrl', 'businessType', 'city', 'state', 'whatsapp', 'email'] as const).map((field) => (
            <label key={field} className="text-sm font-medium capitalize">
              {field === 'websiteUrl' ? 'Website URL' : field}
              <input
                required={field !== 'whatsapp' && field !== 'email'}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-normal"
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Save client</button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <h2 className="px-5 py-4 text-lg font-semibold">Clients</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-y border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="px-5 py-2 font-medium">Website</th>
              <th className="px-5 py-2 font-medium">Type</th>
              <th className="px-5 py-2 font-medium">City</th>
              <th className="px-5 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-zinc-100">
                <td className="px-5 py-3 font-medium">{client.name}</td>
                <td className="px-5 py-3">{client.websiteUrl}</td>
                <td className="px-5 py-3">{client.businessType}</td>
                <td className="px-5 py-3">{client.city}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => runAudit(client.id)} className="font-medium cursor-pointer text-teal-800">
                      Run audit
                    </button>
                    <Link href={`/dashboard/${client.id}`} className="text-zinc-600">
                      Dashboard
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <h2 className="px-5 py-4 text-lg font-semibold">Audit history</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-y border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">Client</th>
              <th className="px-5 py-2 font-medium">Status</th>
              <th className="px-5 py-2 font-medium">Score</th>
              <th className="px-5 py-2 font-medium">Trigger</th>
              <th className="px-5 py-2 font-medium">Created</th>
              <th className="px-5 py-2 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => (
              <tr key={audit.id} className="border-b border-zinc-100">
                <td className="px-5 py-3">
                  <Link href={`/admin/audits/${audit.id}`} className="font-medium text-teal-800">
                    {audit.client?.name || audit.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-5 py-3"><StatusBadge status={audit.status} /></td>
                <td className="px-5 py-3">{audit.overallScore ?? '—'}</td>
                <td className="px-5 py-3">{audit.triggeredBy}</td>
                <td className="px-5 py-3">{new Date(audit.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3 text-red-700">{audit.errorMessage || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
