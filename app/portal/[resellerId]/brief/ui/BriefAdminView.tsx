'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { Moon, Sun, Copy, Plus, ExternalLink } from 'lucide-react';
import { useLucianoPortalThemeOptional } from '../../dashboard/LucianoPortalTheme';
import { LUCINO_PRODUCT_TITLE } from '@/lib/portal-luciano-ui';
import { DEFAULT_BRIEF_QUESTIONS, type BriefQuestion } from '@/lib/brief-default-questions';

type BriefListRow = {
  token: string;
  createdAt: string | Date;
  completedAt: string | Date | null;
  score: number | null;
  negocio: string;
  contacto: string;
};

type Props = {
  resellerId: string;
  brandLogo: string | null | undefined;
  brandName: string | null | undefined;
  brandColor: string | null | undefined;
  nombre: string;
  briefs: BriefListRow[];
};

function fmt(d: string | Date | null | undefined) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function BriefAdminView({
  resellerId,
  brandLogo,
  brandName,
  brandColor,
  nombre,
  briefs,
}: Props) {
  const ctx = useLucianoPortalThemeOptional();
  const light = ctx?.light ?? true;
  const isLuciano = ctx?.isLuciano ?? false;
  const toggleTheme = ctx?.toggleTheme;

  const accent = '#CCFF00';
  const pageBg = '#f8f9fa';
  const headerBg = 'rgba(255,255,255,0.92)';
  const headerBorder = 'rgba(15,23,42,0.08)';
  const cardBg = '#ffffff';
  const cardBorder = 'rgba(15,23,42,0.08)';
  const titleColor = '#0f172a';
  const muted = '#64748b';

  const headerLine = isLuciano ? LUCINO_PRODUCT_TITLE : brandName ?? 'Portal';

  const [questions, setQuestions] = useState<BriefQuestion[]>(() =>
    DEFAULT_BRIEF_QUESTIONS.map((q) => ({ ...q }))
  );
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const grouped = useMemo(() => {
    const m = new Map<1 | 2 | 3 | 4, BriefQuestion[]>();
    m.set(1, []); m.set(2, []); m.set(3, []); m.set(4, []);
    for (const q of questions) m.get(q.step)!.push(q);
    return m;
  }, [questions]);

  const updateLabel = useCallback((id: string, next: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, label: next } : q)));
  }, []);

  const addQuestion = useCallback((step: 1 | 2 | 3 | 4) => {
    const id = `custom_${step}_${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      { id, step, label: 'Nueva pregunta', type: 'textarea' },
    ]);
  }, []);

  const createLink = useCallback(async () => {
    setError('');
    setCopied(false);
    setShareUrl('');
    setCreating(true);
    try {
      const res = await fetch(`/api/portal/${encodeURIComponent(resellerId)}/briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error creando brief');
      const full = `${window.location.origin}${data.url}`;
      setShareUrl(full);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCreating(false);
    }
  }, [questions, resellerId]);

  const copy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: headerBg, borderColor: headerBorder }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src={brandLogo ?? '/luciano-logo.png'}
              alt={headerLine}
              width={32}
              height={32}
              className="rounded-lg object-contain shrink-0"
              style={{ background: '#fff', padding: 2, border: '1px solid rgba(15,23,42,0.08)' }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#0f766e' }}>{headerLine}</p>
              <p className="text-sm font-bold truncate" style={{ color: titleColor }}>{nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLuciano && toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90"
                style={{ background: '#ffffff', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                aria-label={light ? 'Activar modo oscuro' : 'Activar modo claro'}
              >
                {light ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            )}
            <a
              href={`/api/portal/auth/logout?resellerId=${resellerId}`}
              className="text-xs px-3 py-1.5 rounded-lg transition"
              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-xs mb-5">
          <Link href={`/portal/${resellerId}/dashboard`} className="px-3 py-2 rounded-lg border shadow-sm" style={{ background: '#fff', borderColor: cardBorder, color: '#0f172a' }}>
            Dashboard
          </Link>
          <Link href={`/portal/${resellerId}/clientes`} className="px-3 py-2 rounded-lg border shadow-sm" style={{ background: '#fff', borderColor: cardBorder, color: '#0f172a' }}>
            Mis clientes
          </Link>
          <span className="px-3 py-2 rounded-lg border shadow-sm font-semibold" style={{ background: accent, borderColor: 'rgba(0,0,0,0.06)', color: '#000' }}>
            Brief Digital
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border shadow-sm p-5" style={{ background: cardBg, borderColor: cardBorder }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold" style={{ color: titleColor }}>Brief Digital</h1>
                <p className="text-sm mt-1" style={{ color: muted }}>
                  Edita las preguntas y genera un link único para tu cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={createLink}
                disabled={creating}
                className="rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                style={{ background: accent, color: '#000' }}
              >
                <Plus size={16} /> {creating ? 'Generando…' : 'Generar link'}
              </button>
            </div>

            {error && <p className="mt-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

            {shareUrl && (
              <div className="mt-4 rounded-xl border p-3" style={{ borderColor: cardBorder, background: '#f8fafc' }}>
                <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>Link para compartir</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                  />
                  <button
                    type="button"
                    onClick={copy}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold inline-flex items-center gap-2"
                    style={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }}
                    title="Copiar"
                  >
                    <Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-2 text-xs font-semibold inline-flex items-center gap-2"
                    style={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }}
                    title="Abrir"
                  >
                    <ExternalLink size={14} /> Abrir
                  </a>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-5">
              {([1, 2, 3, 4] as const).map((step) => (
                <div key={step}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                      Paso {step}
                    </p>
                    <button
                      type="button"
                      onClick={() => addQuestion(step)}
                      className="text-xs font-semibold"
                      style={{ color: '#0f766e' }}
                    >
                      + Agregar pregunta
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {grouped.get(step)!.map((q) => (
                      <div key={q.id} className="rounded-xl border p-3" style={{ borderColor: cardBorder, background: '#fff' }}>
                        <p className="text-[11px] font-semibold" style={{ color: muted }}>{q.type.toUpperCase()}</p>
                        <input
                          value={q.label}
                          onChange={(e) => updateLabel(q.id, e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                          style={{ borderColor: '#cbd5e1', color: '#0f172a', background: '#fff' }}
                        />
                      </div>
                    ))}
                    {grouped.get(step)!.length === 0 && <p className="text-xs" style={{ color: muted }}>Sin preguntas.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border shadow-sm p-5" style={{ background: cardBg, borderColor: cardBorder }}>
            <h2 className="text-sm font-bold" style={{ color: titleColor }}>Briefs completados</h2>
            <p className="text-xs mt-1" style={{ color: muted }}>
              Se guardan automáticamente en tu panel y se te envía una alerta por WhatsApp.
            </p>

            <div className="mt-4 space-y-2">
              {briefs.length === 0 ? (
                <p className="text-sm" style={{ color: muted }}>Aún no hay briefs.</p>
              ) : (
                briefs.map((b) => (
                  <div key={b.token} className="rounded-xl border p-4" style={{ borderColor: cardBorder, background: '#fff' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>
                          {b.negocio || 'Sin negocio'} {b.contacto ? `· ${b.contacto}` : ''}
                        </p>
                        <p className="text-xs mt-1" style={{ color: muted }}>
                          Creado: {fmt(b.createdAt)} · Completado: {fmt(b.completedAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs" style={{ color: muted }}>Score</p>
                        <p className="text-lg font-extrabold" style={{ color: b.score === null ? '#94a3b8' : '#0f766e' }}>
                          {b.score === null ? '—' : `${b.score}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`/brief/${b.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold rounded-lg border px-3 py-2"
                        style={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }}
                      >
                        Abrir link
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const full = `${window.location.origin}/brief/${b.token}`;
                          await navigator.clipboard.writeText(full).catch(() => {});
                          setCopied(true);
                          setTimeout(() => setCopied(false), 900);
                        }}
                        className="text-xs font-semibold rounded-lg border px-3 py-2 inline-flex items-center gap-2"
                        style={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }}
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

