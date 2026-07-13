'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import {
  isLucianoReseller,
  LUCINO_PRODUCT_TITLE,
  readLucianoTheme,
  writeLucianoTheme,
  type LucianoThemeMode,
} from '@/lib/portal-luciano-ui';
import { notifyPortalAuthed } from '@/lib/portal-pwa-subscribe';

const EMERALD = '#50C878';
const ACCENT = '#CCFF00';

export default function ClientLogin({
  resellerId,
  clientSlug,
  clientNombre,
  brandLogo,
  brandName: _brandName,
}: {
  resellerId: string;
  clientSlug: string;
  clientNombre?: string;
  brandLogo?: string;
  brandName?: string;
}) {
  const router = useRouter();
  const isLuc = isLucianoReseller(resellerId);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<LucianoThemeMode>('light');

  useEffect(() => {
    if (!isLuc) return;
    try {
      setTheme(readLucianoTheme());
    } catch {
      setTheme('light');
    }
    const on = (e: Event) => {
      const d = (e as CustomEvent<LucianoThemeMode>).detail;
      if (d === 'light' || d === 'dark') setTheme(d);
    };
    window.addEventListener('agentia-luciano-theme', on as EventListener);
    return () => window.removeEventListener('agentia-luciano-theme', on as EventListener);
  }, [isLuc]);

  function toggleTheme() {
    const next: LucianoThemeMode = theme === 'light' ? 'dark' : 'light';
    try {
      writeLucianoTheme(next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${resellerId}/cliente/${clientSlug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        return;
      }
      notifyPortalAuthed();
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  const light = isLuc && theme === 'light';

  const pageBg = light ? '#f1f5f9' : '#0a0a0f';
  const cardBg = light ? 'rgba(255,255,255,0.92)' : '#0d0d1a';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#1c1c2e';
  const cardShadow = light ? '0 24px 80px -32px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset' : undefined;
  const productColor = light ? '#0f766e' : ACCENT;
  const nameColor = light ? '#0f172a' : '#fff';
  const hintColor = light ? '#64748b' : '#556';
  const labelColor = light ? '#475569' : '#778';
  const inputBg = light ? '#ffffff' : '#111';
  const inputBorder = light ? '#cbd5e1' : '#222';
  const inputText = light ? '#0f172a' : '#fff';
  const errBg = light ? '#fef2f2' : '#1a0000';
  const errColor = light ? '#b91c1c' : '#ef4444';
  const btnBg = light ? EMERALD : ACCENT;
  const btnText = light ? '#042f2e' : '#000';

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: pageBg }}
    >
      {isLuc && (
        <button
          type="button"
          onClick={toggleTheme}
          className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition hover:opacity-90"
          style={{
            background: light ? 'rgba(255,255,255,0.9)' : 'rgba(13,13,26,0.9)',
            borderColor: light ? 'rgba(15,23,42,0.12)' : '#2a2a3e',
            color: light ? '#0f172a' : '#e2e8f0',
          }}
          aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </button>
      )}

      <div
        className="w-full max-w-sm rounded-2xl border p-8 backdrop-blur-xl"
        style={{
          background: cardBg,
          borderColor: cardBorder,
          boxShadow: cardShadow,
        }}
      >
        <div className="mb-7 text-center">
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brandLogo}
              alt={isLuc ? LUCINO_PRODUCT_TITLE : 'Logo'}
              className="mx-auto mb-4 h-12 w-auto rounded-xl object-contain"
            />
          ) : (
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{
                background: light ? 'rgba(80,200,120,0.15)' : '#0d1f00',
                border: light ? `1px solid ${EMERALD}44` : '1px solid #CCFF0044',
              }}
            >
              🔐
            </div>
          )}
          {isLuc ? (
            <p
              className="mb-1 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ color: productColor }}
            >
              {LUCINO_PRODUCT_TITLE}
            </p>
          ) : (
            _brandName && (
              <p className="mb-1 text-xs font-semibold tracking-wide" style={{ color: ACCENT }}>
                {_brandName}
              </p>
            )
          )}
          <p className="text-lg font-bold" style={{ color: nameColor }}>
            {clientNombre ?? 'Portal de leads'}
          </p>
          <p className="mt-1 text-xs" style={{ color: hintColor }}>
            Ingresa tu contraseña para ver tus leads
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: labelColor }}>
              Contraseña
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              required
              className={
                light
                  ? 'w-full rounded-xl px-4 py-3 text-sm shadow-sm outline-none ring-emerald-500/35 focus:ring-2'
                  : 'w-full rounded-xl px-4 py-3 text-sm outline-none ring-lime-400/25 focus:ring-2'
              }
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: inputText,
              }}
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl px-3 py-2 text-xs" style={{ background: errBg, color: errColor }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full rounded-xl py-3 text-sm font-bold transition disabled:opacity-40"
            style={{ background: btnBg, color: btnText }}
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
