'use client';

import { useState } from 'react';

export function DecoHouseLogin() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/decohouse/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No autorizado');
        return;
      }
      window.location.reload();
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#071414] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-white border border-white/20 overflow-hidden flex items-center justify-center shadow-sm">
              <img
                src="/deco-logo.png"
                alt="Deco House"
                className="h-full w-full object-contain p-2"
                style={{ filter: 'none' }}
              />
            </div>
            <p className="text-xs text-white/60 mt-3">Deco House</p>
            <h1 className="text-xl font-bold tracking-tight">Acceso a Pipeline</h1>
            <p className="text-sm text-white/60 mt-2">Ingresa usuario y contraseña para continuar.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/70">Usuario</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-300/40"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/70">Contraseña</label>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-300/40"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 transition disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

