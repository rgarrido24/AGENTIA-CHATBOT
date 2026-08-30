'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import {
  isLucianoReseller,
  LUCINO_PRODUCT_TITLE,
  readLucianoTheme,
  writeLucianoTheme,
  type LucianoThemeMode,
} from '@/lib/portal-luciano-ui';

type Brand = { brandLogo: string | null; brandName: string | null; brandColor: string | null };

const DEFAULT_BRAND: Brand = {
  brandLogo: '/logo-agentia-2026.png',
  brandName: 'Portal Agentia',
  brandColor: '#22c55e',
};

export default function PortalLoginPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const router = useRouter();
  const isLuc = isLucianoReseller(resellerId);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [theme, setTheme] = useState<LucianoThemeMode>('light');

  useEffect(() => {
    fetch(`/api/portal/${resellerId}/brand`)
      .then((r) => r.json())
      .then((data: Partial<Brand>) => {
        setBrand({
          brandLogo: data.brandLogo || DEFAULT_BRAND.brandLogo,
          brandName: data.brandName || DEFAULT_BRAND.brandName,
          brandColor: data.brandColor || DEFAULT_BRAND.brandColor,
        });
      })
      .catch(() => {
        /* defaults */
      });
  }, [resellerId]);

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

  const accent = brand.brandColor ?? '#22c55e';
  const light = isLuc && theme === 'light';

  const pageBg = light ? '#f1f5f9' : '#000';
  const cardBg = light ? 'rgba(255,255,255,0.95)' : '#0d0d0d';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#222';
  const logoBg = light ? '#f8fafc' : '#111';
  const titleColor = light ? '#0f172a' : '#fff';
  const subtitleColor = light ? '#64748b' : '#555';
  const h2Color = light ? '#0f172a' : '#fff';
  const labelColor = light ? '#475569' : '#666';
  const inputBg = light ? '#ffffff' : '#111';
  const inputBorder = light ? '#cbd5e1' : '#2a2a2a';
  const inputText = light ? '#0f172a' : '#fff';
  const errBg = light ? '#fef2f2' : '#1a0000';
  const btnText = light ? '#042f2e' : '#000';
  const btnBg = light ? '#50C878' : accent;
  const footerColor = light ? '#94a3b8' : '#555';
  const footerLink = light ? '#0d9488' : '#888';

  const displayName = isLuc ? LUCINO_PRODUCT_TITLE : brand.brandName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }
      router.push(data.redirect);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: pageBg }}
    >
      {isLuc && (
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition hover:opacity-90"
          style={{
            background: light ? 'rgba(255,255,255,0.9)' : 'rgba(13,13,13,0.9)',
            borderColor: light ? 'rgba(15,23,42,0.12)' : '#2a2a2a',
            color: light ? '#0f172a' : '#e2e8f0',
          }}
          aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      )}

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image
            src={brand.brandLogo ?? DEFAULT_BRAND.brandLogo!}
            alt={displayName ?? 'Portal'}
            width={56}
            height={56}
            className="rounded-2xl object-contain"
            style={{
              background: logoBg,
              padding: 4,
              border: light ? '1px solid rgba(15,23,42,0.08)' : undefined,
            }}
          />
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ color: titleColor }}>
              {displayName}
            </h1>
            <p className="text-xs mt-1" style={{ color: subtitleColor }}>
              Panel de gestión de leads
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-6 border shadow-lg" style={{ background: cardBg, borderColor: cardBorder }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: h2Color }}>
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: labelColor }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: inputText,
                }}
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: errBg, color: '#ef4444' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: btnBg, color: btnText }}
            >
              {loading ? 'Verificando…' : 'Entrar al portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: footerColor }}>
          Powered by{' '}
          <a href="https://agentia.software" className="hover:underline" style={{ color: footerLink }}>
            agentia.software
          </a>
        </p>
      </div>
    </div>
  );
}
