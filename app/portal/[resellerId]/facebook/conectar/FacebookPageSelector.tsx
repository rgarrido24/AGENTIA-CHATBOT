'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucianoPortalThemeProvider, useLucianoPortalThemeOptional } from '../../dashboard/LucianoPortalTheme';

type PageOpt = { id: string; name: string };

function SelectorInner({
  resellerId,
  clientSlug,
  pages,
}: {
  resellerId: string;
  clientSlug: string;
  pages: PageOpt[];
}) {
  const router = useRouter();
  const ctx = useLucianoPortalThemeOptional();
  const light = ctx?.light ?? false;
  const [pageId, setPageId] = useState(pages[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pageBg = light ? '#f1f5f9' : '#000';
  const cardBg = light ? '#ffffff' : '#0d0d0d';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const titleColor = light ? '#0f172a' : '#fff';
  const muted = light ? '#64748b' : '#94a3b8';
  const errBg = light ? '#fef2f2' : '#1a0000';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pageId) {
      setError('Elegí una página de Facebook.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portal/${resellerId}/client/${clientSlug}/facebook/select-page`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error || 'No se pudo conectar esa página.');
        return;
      }
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      router.push(`/portal/${resellerId}/clientes?fb=connected`);
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: pageBg }}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-2xl border p-6 shadow-sm space-y-4"
        style={{ background: cardBg, borderColor: cardBorder }}
      >
        <p className="text-sm font-bold" style={{ color: titleColor }}>
          Elegí la página de Facebook
        </p>
        <p className="text-xs" style={{ color: muted }}>
          Esta cuenta tiene varias páginas. Seleccioná la del cliente para recibir los leads.
        </p>
        <div className="space-y-2">
          {pages.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer"
              style={{
                borderColor: pageId === p.id ? (light ? '#0d9488' : '#CCFF00') : cardBorder,
                background: pageId === p.id ? (light ? '#f0fdfa' : '#111') : 'transparent',
              }}
            >
              <input
                type="radio"
                name="page"
                value={p.id}
                checked={pageId === p.id}
                onChange={() => setPageId(p.id)}
              />
              <span className="text-sm font-medium" style={{ color: titleColor }}>
                {p.name}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: errBg, color: '#ef4444' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <a
            href={`/portal/${resellerId}/clientes`}
            className="flex-1 text-center py-2.5 rounded-xl text-sm"
            style={{
              background: light ? '#f1f5f9' : '#111',
              color: muted,
              border: `1px solid ${cardBorder}`,
            }}
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading || !pageId}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: light ? '#CCFF00' : '#22c55e', color: '#000' }}
          >
            {loading ? 'Conectando…' : 'Usar esta página'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function FacebookPageSelector({
  resellerId,
  clientSlug,
  pages,
}: {
  resellerId: string;
  clientSlug: string;
  pages: PageOpt[];
}) {
  return (
    <LucianoPortalThemeProvider resellerId={resellerId}>
      <SelectorInner resellerId={resellerId} clientSlug={clientSlug} pages={pages} />
    </LucianoPortalThemeProvider>
  );
}
