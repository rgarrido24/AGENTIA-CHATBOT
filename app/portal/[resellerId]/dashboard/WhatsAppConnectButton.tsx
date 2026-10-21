'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Account = {
  displayPhone?: string;
  verifiedName?: string;
  qualityRating?: string;
  status: 'connected' | 'error';
  lastError?: string;
} | null;

type FbSdk = {
  init: (o: Record<string, unknown>) => void;
  login: (cb: (r: { authResponse?: { code?: string } }) => void, o: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    FB?: FbSdk;
    fbAsyncInit?: () => void;
  }
}

function loadFbSdk(appId: string): Promise<FbSdk> {
  return new Promise((resolve, reject) => {
    const init = () => {
      if (!window.FB) return reject(new Error('SDK de Facebook no disponible'));
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: 'v21.0' });
      resolve(window.FB);
    };
    if (window.FB) return init();
    window.fbAsyncInit = init;
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.onerror = () => reject(new Error('No se pudo cargar el SDK de Facebook'));
    document.body.appendChild(s);
  });
}

/** Conecta la cuenta de WhatsApp Business del cliente con Embedded Signup. Solo visible con el add-on activo. */
export default function WhatsAppConnectButton({ resellerId, clientSlug }: { resellerId: string; clientSlug: string }) {
  const base = `/api/portal/${resellerId}/client/${clientSlug}/whatsapp/connect`;
  const [account, setAccount] = useState<Account>(null);
  const [cfg, setCfg] = useState<{ appId: string; configId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const signupRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: 'no-store' });
      const data = (await res.json()) as { account?: Account; appId?: string; configId?: string; error?: string };
      if (!res.ok) return setMsg(data.error || 'No se pudo leer el estado');
      setAccount(data.account ?? null);
      setCfg({ appId: data.appId ?? '', configId: data.configId ?? '' });
    } catch {
      setMsg('Error de conexión');
    }
  }, [base]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    // Embedded Signup avisa el waba_id / phone_number_id por postMessage al terminar.
    const onMessage = (e: MessageEvent) => {
      if (!/facebook\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d?.type === 'WA_EMBEDDED_SIGNUP' && d.event === 'FINISH') {
          signupRef.current = { wabaId: d.data?.waba_id, phoneNumberId: d.data?.phone_number_id };
        }
      } catch {
        /* mensajes ajenos */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  async function connect() {
    if (!cfg?.appId || !cfg.configId) {
      setMsg('Falta configurar WA_EMBEDDED_SIGNUP_CONFIG_ID en el servidor.');
      return;
    }
    setBusy(true);
    setMsg('');
    signupRef.current = {};
    try {
      const FB = await loadFbSdk(cfg.appId);
      FB.login(
        (r) => {
          const code = r.authResponse?.code;
          if (!code) {
            setBusy(false);
            setMsg('Conexión cancelada.');
            return;
          }
          // El postMessage con los IDs puede llegar unos ms después del callback.
          setTimeout(async () => {
            const { wabaId, phoneNumberId } = signupRef.current;
            if (!wabaId || !phoneNumberId) {
              setBusy(false);
              setMsg('Meta no devolvió la cuenta ni el número. Intenta de nuevo.');
              return;
            }
            const res = await fetch(base, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, wabaId, phoneNumberId }),
            });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setBusy(false);
            if (!res.ok) return setMsg(data.error || 'No se pudo conectar');
            await refresh();
          }, 1500);
        },
        {
          config_id: cfg.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, sessionInfoVersion: '3' },
        },
      );
    } catch (e) {
      setBusy(false);
      setMsg(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: 'rgba(128,128,128,0.35)' }}>
      <p className="font-semibold">WhatsApp Business (API oficial)</p>
      {account ? (
        <p className="mt-1">
          {account.status === 'connected' ? '✔ Conectado' : '⚠ Conectado con errores'} · {account.displayPhone ?? 's/n'}
          {account.verifiedName ? ` · ${account.verifiedName}` : ''}
          {account.qualityRating ? ` · calidad ${account.qualityRating}` : ''}
          {account.lastError ? <span className="block opacity-70">{account.lastError}</span> : null}
        </p>
      ) : (
        <p className="mt-1 opacity-70">Sin número conectado.</p>
      )}
      <button
        type="button"
        onClick={() => void connect()}
        disabled={busy}
        className="mt-2 rounded-lg px-3 py-1.5 font-semibold disabled:opacity-50"
        style={{ background: '#22c55e', color: '#fff' }}
      >
        {busy ? 'Conectando…' : account ? 'Reconectar número' : 'Conectar número'}
      </button>
      {account ? (
        <a
          href={`/portal/${resellerId}/cliente/${clientSlug}/whatsapp`}
          className="mt-2 block underline"
        >
          Abrir plantillas y campañas →
        </a>
      ) : null}
      {account ? (
        <a href={`/portal/${resellerId}/cliente/${clientSlug}/whatsapp/bandeja`} className="mt-1 block underline">
          Abrir bandeja de respuestas →
        </a>
      ) : null}
      {msg ? <p className="mt-2 text-red-500">{msg}</p> : null}
    </div>
  );
}
