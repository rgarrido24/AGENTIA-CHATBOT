'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CwfLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/cwf-panel/conversaciones';
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
      <h1 className="text-xl font-bold text-white/95 mb-2">CWF Panel</h1>
      <p className="text-sm text-amber-200/70 mb-6">Conversaciones WhatsApp — Flood CWF México</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoComplete="username"
          className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-900/40 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
          autoFocus
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-900/40 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
          disabled={loading}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-semibold disabled:opacity-50 transition"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function CwfPanelLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1208] p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl p-8 animate-pulse bg-stone-900/50 border border-amber-900/30 h-72" />
        }
      >
        <CwfLoginForm />
      </Suspense>
    </main>
  );
}
