'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setPending(false);
    if (!response.ok) {
      setError('Those credentials did not match ADMIN_USER and ADMIN_PASSWORD.');
      return;
    }
    router.push(searchParams.get('next') || '/admin');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-500">Internal portal for triggering SEO audits.</p>
      </div>
      <label className="block text-sm font-medium">
        Username
        <input
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          type="password"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Suspense fallback={<p>Loading login...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
