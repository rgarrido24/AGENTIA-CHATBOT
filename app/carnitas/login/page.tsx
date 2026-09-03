'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTenant } from '@/lib/wallet-tenant';

const TENANT = getTenant('carnitas_granada')!;

function CarnitasLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/carnitas/caja';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  const accent = TENANT.colorAcento;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/carnitas/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error || 'Error al iniciar sesión');
        return;
      }
      router.push(from.startsWith('/carnitas') ? from : '/carnitas/caja');
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-white/35 outline-none focus:border-white/40';

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${accent}33`,
      }}
    >
      {logoOk ? (
        <div className="mb-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TENANT.logoUrl}
            alt={TENANT.nombre}
            className="h-28 w-auto object-contain"
            onError={() => setLogoOk(false)}
          />
        </div>
      ) : (
        <p
          className="font-[family-name:var(--font-space)] text-[10px] font-medium uppercase tracking-[0.25em]"
          style={{ color: accent }}
        >
          {TENANT.nombre}
        </p>
      )}
      <h1 className="mt-2 font-[family-name:var(--font-space)] text-xl font-bold text-white/95">
        Acceso a caja
      </h1>
      <p className="mt-1 mb-6 text-sm text-white/50">Lealtad · cashback</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoComplete="username"
          className={inputClass}
          autoFocus
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          className={inputClass}
          disabled={loading}
        />
        {error ? <p className="text-sm text-yellow-200">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accent, color: '#1a1a1a' }}
        >
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function CarnitasLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <Suspense
        fallback={
          <div className="h-72 w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
        }
      >
        <CarnitasLoginForm />
      </Suspense>
    </div>
  );
}
