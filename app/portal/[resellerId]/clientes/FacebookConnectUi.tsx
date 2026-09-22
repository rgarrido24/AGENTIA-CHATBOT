'use client';

import { useEffect, useState } from 'react';
import { useLucianoPortalThemeOptional } from '../dashboard/LucianoPortalTheme';
import { fbConnectUserMessage, type FbConnectReveal } from '@/lib/facebook-connect-messages';

export function FbConnectionBadge({
  status,
  light,
}: {
  status: 'pending' | 'connected';
  light?: boolean;
}) {
  const connected = status === 'connected';
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={
        connected
          ? {
              background: light ? '#ecfdf5' : '#0d2200',
              color: light ? '#047857' : '#22c55e',
            }
          : {
              background: light ? '#fff7ed' : '#1a1200',
              color: light ? '#c2410c' : '#fbbf24',
            }
      }
    >
      {connected ? 'Conectado ✓' : 'Pendiente de conexión'}
    </span>
  );
}

export function FbConnectLink({
  resellerId,
  clientSlug,
  connected,
  light,
}: {
  resellerId: string;
  clientSlug: string;
  connected: boolean;
  light?: boolean;
}) {
  return (
    <a
      href={`/api/portal/${resellerId}/client/${clientSlug}/facebook/connect`}
      className="text-[10px] font-semibold rounded-lg px-2 py-0.5 whitespace-nowrap"
      style={{
        background: light ? '#eff6ff' : '#0a1628',
        color: light ? '#1d4ed8' : '#93c5fd',
        border: `1px solid ${light ? '#bfdbfe' : '#1e3a5f'}`,
      }}
    >
      {connected ? 'Reconectar' : 'Conectar Facebook'}
    </a>
  );
}

function CopyBtn({ text, light }: { text: string; light: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="text-[10px] font-semibold rounded-lg px-2 py-1"
      style={{
        background: light ? '#e2e8f0' : '#222',
        color: light ? '#0f172a' : '#e2e8f0',
      }}
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export function FacebookConnectBanners({
  resellerId,
  fbError,
  fbJustConnected,
}: {
  resellerId: string;
  fbError?: string;
  fbJustConnected?: boolean;
}) {
  const ctx = useLucianoPortalThemeOptional();
  const light = ctx?.light ?? false;
  const [reveal, setReveal] = useState<FbConnectReveal | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!fbJustConnected) return;
    let cancelled = false;
    void fetch(`/api/portal/${resellerId}/facebook/connect-result`)
      .then((r) => r.json())
      .then((data: { reveal?: FbConnectReveal | null }) => {
        if (!cancelled && data.reveal) setReveal(data.reveal);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fbJustConnected, resellerId]);

  const cardBg = light ? '#ffffff' : '#0d0d0d';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const titleColor = light ? '#0f172a' : '#fff';
  const muted = light ? '#64748b' : '#94a3b8';
  const pwdBoxBg = light ? '#f0fdf4' : '#0d1f00';
  const pwdBoxBorder = light ? '#86efac' : '#CCFF0044';
  const pwdBoxText = light ? '#166534' : '#CCFF00';

  return (
    <div className="space-y-3 mb-4">
      {fbError && (
        <div
          className="rounded-xl border px-4 py-3 text-xs"
          style={{ background: light ? '#fef2f2' : '#1a0000', borderColor: light ? '#fecaca' : '#3f1010', color: '#ef4444' }}
        >
          {fbConnectUserMessage(fbError)}
        </div>
      )}
      {fbJustConnected && !reveal && !closed && (
        <div
          className="rounded-xl border px-4 py-3 text-xs"
          style={{
            background: light ? '#ecfdf5' : '#0d2200',
            borderColor: light ? '#a7f3d0' : '#14532d',
            color: light ? '#047857' : '#86efac',
          }}
        >
          Facebook conectado. Los leads de esa página van a entrar a este cliente.
        </div>
      )}
      {reveal && !closed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border p-5 shadow-xl space-y-3" style={{ background: cardBg, borderColor: cardBorder }}>
            <p className="text-sm font-bold" style={{ color: titleColor }}>
              Facebook conectado
            </p>
            <p className="text-xs" style={{ color: muted }}>
              {reveal.nombre} · {reveal.pageName} · {reveal.formsCount} formulario(s). Pasale estos datos al cliente ahora: la contraseña solo se muestra una vez.
            </p>
            <div>
              <p className="text-[10px] mb-1" style={{ color: muted }}>Link del portal</p>
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs break-all font-mono" style={{ color: titleColor }}>
                  {reveal.portalUrl}
                </p>
                <CopyBtn text={reveal.portalUrl} light={light} />
              </div>
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: muted }}>Contraseña</p>
              <div
                className="rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest select-all"
                style={{ background: pwdBoxBg, border: `1px solid ${pwdBoxBorder}`, color: pwdBoxText }}
              >
                {reveal.password}
              </div>
              <div className="mt-2 flex justify-end">
                <CopyBtn
                  text={`Panel: ${reveal.portalUrl}\nContraseña: ${reveal.password}`}
                  light={light}
                />
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: light ? '#CCFF00' : '#22c55e', color: '#000' }}
              onClick={() => setClosed(true)}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
