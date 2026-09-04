'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLoyaltyTenant } from '@/components/loyalty/tenant-context';

function Form({ negocio }: { negocio: string }) {
  const tenant = useLoyaltyTenant(negocio);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || `/demo/${negocio}/caja`;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  const accent = tenant?.colorAcento ?? '#D9A94E';
  const nombre = tenant?.nombre ?? 'Demo';
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/demo/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error || 'Error al iniciar sesión');
        return;
      }
      router.push(from.startsWith(`/demo/${negocio}`) ? from : `/demo/${negocio}/caja`);
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-white/35 outline-none transition-colors focus:border-white/40';

  return (
    <div
      className="w-full max-w-sm rounded-3xl p-8 shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${accent}40`,
      }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white"
          style={{ borderColor: `${accent}66` }}
          aria-hidden
        >
          {logoOk && tenant?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt=""
              className="h-full w-full object-contain p-0.5"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-base font-bold"
              style={{ color: accent, backgroundColor: tenant?.colorPrimario }}
            >
              {inicial}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p
            className="font-[family-name:var(--font-space)] text-[10px] font-medium uppercase tracking-[0.25em]"
            style={{ color: accent }}
          >
            Demo
          </p>
          <p className="truncate font-[family-name:var(--font-space)] text-lg font-bold text-white">
            {nombre}
          </p>
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-space)] text-xl font-bold text-white/95">
        Acceso a caja
      </h1>
      <p className="mt-1 mb-6 text-sm text-white/50">Lealtad · demostración</p>

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
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accent, color: '#1a1a1a' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export function DemoLoginForm({ negocio }: { negocio: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <Suspense
        fallback={
          <div className="h-80 w-full max-w-sm animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
        }
      >
        <Form negocio={negocio} />
      </Suspense>
    </div>
  );
}
