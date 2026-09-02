'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { izziPanelBrand } from '@/lib/izzi-panel-brand';

function IzziLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/izzi-panel/conversaciones';
  const [username, setUsername] = useState(
    (searchParams.get('clientId') || '').trim().toLowerCase() === 'izzi-2' ? 'izzi-2' : ''
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = (searchParams.get('clientId') || '').trim().toLowerCase();
  const typed = username.trim().toLowerCase();
  const brand = izziPanelBrand(typed === 'izzi-2' || queryClient === 'izzi-2' ? 'izzi-2' : 'izzi');

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
    <main className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: brand.bg }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${brand.border}`,
        }}
      >
        {brand.logoSrc ? (
          <img src={brand.logoSrc} alt={brand.name} className="h-14 w-14 rounded-2xl mb-4" />
        ) : (
          <p className={`text-xs uppercase tracking-widest font-semibold mb-1 ${brand.label}`}>izzi</p>
        )}
        <h1 className="text-xl font-bold text-white/95 mb-2">
          {brand.id === 'rgo' ? 'Panel RGO' : 'Panel de conversaciones'}
        </h1>
        <p className={`text-sm mb-6 ${brand.muted}`}>
          {brand.id === 'rgo' ? (
            'Usuario izzi-2. Contraseña: la de IZZI_PANEL_USERS en Render.'
          ) : (
            <>
              Cada cuenta entra con su usuario (<code className="opacity-90">izzi</code>,{' '}
              <code className="opacity-90">izzi-2</code>…).
            </>
          )}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="izzi-user" className={`mb-1.5 block text-xs ${brand.muted}`}>
              Usuario
            </label>
            <input
              id="izzi-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={brand.id === 'rgo' ? 'izzi-2' : 'Usuario'}
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border text-white placeholder-stone-500 focus:outline-none focus:ring-2 min-h-[44px]"
              style={{ borderColor: brand.border }}
              autoFocus
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="izzi-pass" className={`mb-1.5 block text-xs ${brand.muted}`}>
              Contraseña
            </label>
            <input
              id="izzi-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border text-white placeholder-stone-500 focus:outline-none focus:ring-2 min-h-[44px]"
              style={{ borderColor: brand.border }}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${brand.sendClass} text-white font-semibold disabled:opacity-50 transition min-h-[44px]`}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function IzziPanelLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] flex items-center justify-center bg-[#070B16] p-4">
          <div className="w-full max-w-sm rounded-2xl p-8 animate-pulse bg-stone-900/50 border border-blue-900/30 h-72" />
        </main>
      }
    >
      <IzziLoginForm />
    </Suspense>
  );
}
