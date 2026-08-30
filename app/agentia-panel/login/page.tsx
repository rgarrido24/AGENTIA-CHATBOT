'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AgentiaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/agentia-panel/conversaciones';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Error al iniciar sesión');
        return;
      }
      router.push(from);
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
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h1 className="text-xl font-bold text-white/95 mb-2">Agentia Panel</h1>
      <p className="text-sm text-slate-400 mb-6">Conversaciones multi-canal · WhatsApp API oficial</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoComplete="username"
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 transition"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function AgentiaPanelLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl p-8 animate-pulse bg-slate-900/50 border border-slate-700 h-72" />
        }
      >
        <AgentiaLoginForm />
      </Suspense>
    </main>
  );
}
