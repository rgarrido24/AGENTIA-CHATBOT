'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SabucanLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/sabucan/caja';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/sabucan/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error || 'Error al iniciar sesión');
        return;
      }
      router.push(from.startsWith('/sabucan') ? from : '/sabucan/caja');
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,212,255,0.2)',
      }}
    >
      <p className="font-[family-name:var(--font-space)] text-[10px] font-medium uppercase tracking-[0.25em] text-[#00D4FF]">
        SABUCAN
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-space)] text-xl font-bold text-white/95">
        Acceso a caja
      </h1>
      <p className="mt-1 mb-6 text-sm text-white/45">Lealtad · recepción</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoComplete="username"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#00D4FF]/50 focus:ring-2 focus:ring-[#00D4FF]/25"
          autoFocus
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#00D4FF]/50 focus:ring-2 focus:ring-[#00D4FF]/25"
          disabled={loading}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function SabucanLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <Suspense
        fallback={
          <div className="h-72 w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        }
      >
        <SabucanLoginForm />
      </Suspense>
    </div>
  );
}
