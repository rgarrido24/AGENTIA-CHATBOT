'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLogin({
  resellerId,
  clientSlug,
  clientNombre,
  brandLogo,
  brandName,
}: {
  resellerId:    string;
  clientSlug:    string;
  clientNombre?: string;
  brandLogo?:    string;
  brandName?:    string;
}) {
  const router   = useRouter();
  const [pw,     setPw]     = useState('');
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portal/${resellerId}/cliente/${clientSlug}/login`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ password: pw }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0a0a0f' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: '#0d0d1a', borderColor: '#1c1c2e' }}
      >
        <div className="text-center mb-7">
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brandLogo}
              alt={brandName ?? 'Logo'}
              className="h-12 w-auto mx-auto mb-4 rounded-xl object-contain"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mx-auto mb-4"
              style={{ background: '#0d1f00', border: '1px solid #CCFF0044' }}
            >
              🔐
            </div>
          )}
          {brandName && (
            <p className="text-xs font-semibold tracking-wide mb-1" style={{ color: '#CCFF00' }}>
              {brandName}
            </p>
          )}
          <p className="text-white font-bold text-lg">
            {clientNombre ?? 'Portal de leads'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#556' }}>
            Ingresa tu contraseña para ver tus leads
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: '#778' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              required
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{
                background:  '#111',
                border:      '1px solid #222',
                color:       '#fff',
                outline:     'none',
              }}
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <p
              className="text-xs rounded-xl px-3 py-2"
              style={{ background: '#1a0000', color: '#ef4444' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full py-3 rounded-xl text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#CCFF00', color: '#000' }}
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
