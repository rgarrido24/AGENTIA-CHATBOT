'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function IzziLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/izzi-panel/conversaciones';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const clientId = searchParams.get('clientId');
    if (!token || !clientId) return;
    const q = new URLSearchParams({ clientId, token });
    window.location.replace(`/api/izzi-panel/auth/from-panel-token?${q.toString()}`);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/izzi-panel/auth/login', {
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
        border: '1px solid rgba(236,0,140,0.18)',
      }}
    >
      <p className="text-xs uppercase tracking-widest text-pink-400/80 font-semibold mb-1">izzi</p>
      <h1 className="text-xl font-bold text-white/95 mb-2">Panel de conversaciones</h1>
      <p className="text-sm text-pink-200/60 mb-6">
        Cada cuenta entra con su usuario (<code className="text-pink-200/80">izzi</code>,{' '}
        <code className="text-pink-200/80">izzi-2</code>…). Chats y QR no se mezclan. Si te
        compartieron un enlace con token, úsalo; también puedes poner ese token como contraseña.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="izzi-user" className="mb-1.5 block text-xs text-pink-100/70">
            Usuario
          </label>
          <input
            id="izzi-user"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-pink-900/40 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-pink-600 min-h-[44px]"
            autoFocus
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="izzi-pass" className="mb-1.5 block text-xs text-pink-100/70">
            Contraseña
          </label>
          <input
            id="izzi-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-pink-900/40 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-pink-600 min-h-[44px]"
            disabled={loading}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#EC008C] hover:bg-pink-500 text-white font-semibold disabled:opacity-50 transition min-h-[44px]"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function IzziPanelLoginPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#140810] p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl p-8 animate-pulse bg-stone-900/50 border border-pink-900/30 h-72" />
        }
      >
        <IzziLoginForm />
      </Suspense>
    </main>
  );
}
