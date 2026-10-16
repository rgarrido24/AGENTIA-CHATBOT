'use client';

import { useEffect, useState } from 'react';
import { useLucianoPortalThemeOptional } from '../dashboard/LucianoPortalTheme';
import { fbConnectUserMessage, fbPausedFormsNotice, type FbConnectReveal } from '@/lib/facebook-connect-messages';

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

type TestForm = {
  formId: string;
  formName: string;
  created: boolean;
  error?: string;
  result: { arrived: boolean; routed?: boolean; seconds?: number } | null;
};

const TEST_POLL_MS = 3000;
const TEST_TIMEOUT_MS = 60000;

/** Manda un lead de prueba a cada formulario activo y confirma si llegó al panel del cliente. */
export function FbTestLeadButton({
  resellerId,
  clientSlug,
  light,
  label = 'Probar leads',
}: {
  resellerId: string;
  clientSlug: string;
  light?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [forms, setForms] = useState<TestForm[]>([]);
  const [timedOut, setTimedOut] = useState(false);

  const base = `/api/portal/${resellerId}/client/${clientSlug}/facebook/test-lead`;
  const muted = light ? '#64748b' : '#94a3b8';
  const titleColor = light ? '#0f172a' : '#fff';

  async function run() {
    setOpen(true);
    setRunning(true);
    setError('');
    setForms([]);
    setTimedOut(false);
    try {
      const res = await fetch(base, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        runId?: string;
        forms?: Array<Omit<TestForm, 'result'>>;
      };
      if (!res.ok || !data.runId) {
        setError(data.error || 'No se pudo iniciar la prueba.');
        setRunning(false);
        return;
      }
      setForms((data.forms || []).map((f) => ({ ...f, result: null })));
      const started = Date.now();
      for (;;) {
        await new Promise((r) => setTimeout(r, TEST_POLL_MS));
        const poll = await fetch(`${base}?runId=${encodeURIComponent(data.runId)}`);
        const pd = (await poll.json().catch(() => ({}))) as { done?: boolean; forms?: TestForm[] };
        if (pd.forms) setForms(pd.forms);
        if (pd.done) break;
        if (Date.now() - started > TEST_TIMEOUT_MS) {
          setTimedOut(true);
          break;
        }
      }
    } catch {
      setError('Se cortó la conexión durante la prueba. Probá de nuevo.');
    }
    setRunning(false);
  }

  function statusLine(f: TestForm): { icon: string; text: string; color: string } {
    if (!f.created) {
      return { icon: '✖', text: `No se pudo crear la prueba: ${f.error || 'error de Meta'}`, color: '#ef4444' };
    }
    if (f.result?.arrived && f.result.routed) {
      return { icon: '✔', text: `Llegó al panel en ${f.result.seconds ?? '?'} s. El lead de prueba se borró solo.`, color: '#16a34a' };
    }
    if (f.result?.arrived) {
      return {
        icon: '⚠',
        text: 'Llegó pero NO se asignó a este cliente. Este formulario no está activo en su panel: reconectá Facebook.',
        color: '#d97706',
      };
    }
    if (timedOut) {
      return {
        icon: '✖',
        text: 'No llegó en 60 s. Meta no está avisando a Agentia: reconectá Facebook y probá de nuevo.',
        color: '#ef4444',
      };
    }
    return { icon: '…', text: 'Esperando que llegue…', color: muted };
  }

  const allOk = forms.length > 0 && forms.every((f) => f.result?.arrived && f.result.routed);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void run();
        }}
        className="text-[10px] font-semibold rounded-lg px-2 py-0.5 whitespace-nowrap"
        style={{
          background: light ? '#faf5ff' : '#1a0d2e',
          color: light ? '#7e22ce' : '#d8b4fe',
          border: `1px solid ${light ? '#e9d5ff' : '#3b1d63'}`,
        }}
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-sm rounded-xl border p-5 shadow-xl space-y-3"
            style={{ background: light ? '#ffffff' : '#0d0d0d', borderColor: light ? 'rgba(15,23,42,0.08)' : '#1e1e1e' }}
          >
            <p className="text-sm font-bold" style={{ color: titleColor }}>
              Prueba de leads
            </p>
            <p className="text-xs" style={{ color: muted }}>
              Se manda un lead de prueba a cada formulario activo. No avisa al asesor y se borra solo.
            </p>
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
            {forms.map((f) => {
              const s = statusLine(f);
              return (
                <div key={f.formId} className="text-xs" style={{ color: s.color }}>
                  <p className="font-semibold" style={{ color: titleColor }}>{f.formName}</p>
                  <p>
                    {s.icon} {s.text}
                  </p>
                </div>
              );
            })}
            {running && <p className="text-[11px]" style={{ color: muted }}>Probando… puede tardar hasta un minuto.</p>}
            {!running && allOk && (
              <p className="text-xs font-semibold" style={{ color: '#16a34a' }}>
                Todo OK: los leads de este cliente están llegando.
              </p>
            )}
            {!running && (error || forms.some((f) => !f.created)) && (
              <p className="text-[11px]" style={{ color: muted }}>
                Alternativa: probá con la herramienta de Meta en developers.facebook.com/tools/lead-ads-testing
              </p>
            )}
            <button
              type="button"
              disabled={running}
              className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: light ? '#CCFF00' : '#22c55e', color: '#000' }}
              onClick={() => setOpen(false)}
            >
              {running ? 'Probando…' : 'Cerrar'}
            </button>
          </div>
        </div>
      )}
    </>
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
  fbPausedForms,
}: {
  resellerId: string;
  fbError?: string;
  fbJustConnected?: boolean;
  fbPausedForms?: boolean;
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
      {fbPausedForms && !fbError && (
        <div
          className="rounded-xl border px-4 py-3 text-xs"
          style={{
            background: light ? '#fffbeb' : '#1a1400',
            borderColor: light ? '#fde68a' : '#3f2f00',
            color: light ? '#b45309' : '#fbbf24',
          }}
        >
          {fbPausedFormsNotice()}
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
            <div className="flex justify-end">
              <FbTestLeadButton
                resellerId={resellerId}
                clientSlug={reveal.clientSlug}
                light={light}
                label="Probar que lleguen leads"
              />
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
