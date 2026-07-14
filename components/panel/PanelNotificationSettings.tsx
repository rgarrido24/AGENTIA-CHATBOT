'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Settings, Volume2, Vibrate, Hash, X } from 'lucide-react';
import {
  DEFAULT_PANEL_NOTIFICATION_PREFS,
  loadPanelNotificationPrefs,
  NOTIFICATION_TONES,
  savePanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
  type PanelNotificationPrefs,
} from '@/lib/panel-notification-prefs';
import type { PortalPushSubscribeResult } from '@/lib/portal-pwa-subscribe';

type PanelNotificationSettingsProps = {
  panel: 'cwf' | 'agentia' | 'portal';
  portalScope?: string;
  resellerId?: string;
  clientSlug?: string;
  pushStatus?: PortalPushSubscribeResult | null;
  onRetryPush?: () => void | Promise<void>;
};

const BRAND = {
  cwf: {
    accent: '#c8863a',
    bg: 'rgba(26, 18, 8, 0.97)',
    border: 'rgba(180, 120, 60, 0.35)',
    text: '#fef3c7',
    muted: '#a8a29e',
  },
  agentia: {
    accent: '#3b82f6',
    bg: 'rgba(10, 15, 26, 0.97)',
    border: 'rgba(59, 130, 246, 0.35)',
    text: '#e2e8f0',
    muted: '#94a3b8',
  },
  portal: {
    accent: '#CCFF00',
    bg: 'rgba(10, 15, 26, 0.97)',
    border: 'rgba(204, 255, 0, 0.35)',
    text: '#e2e8f0',
    muted: '#94a3b8',
  },
} as const;

export function PanelNotificationSettings({
  panel,
  portalScope,
  resellerId,
  clientSlug,
  pushStatus,
  onRetryPush,
}: PanelNotificationSettingsProps) {
  const theme = BRAND[panel];
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<PanelNotificationPrefs>(DEFAULT_PANEL_NOTIFICATION_PREFS);
  const [testingPush, setTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [platformHint, setPlatformHint] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(loadPanelNotificationPrefs(panel, portalScope));
  }, [panel, portalScope]);

  useEffect(() => {
    if (panel !== 'portal' || typeof navigator === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const isChrome = /chrome|crios|chromium/i.test(ua) && !/edg/i.test(ua);
    if (isIos) {
      setPlatformHint('iPhone: push limitado. Usá Android Chrome para alertas gratis.');
    } else if (isAndroid && !isChrome) {
      setPlatformHint('Abrí este panel en Chrome Android.');
    } else if (isAndroid) {
      setPlatformHint('Android Chrome listo. Tocá ACTIVAR abajo.');
    } else {
      setPlatformHint('Ideal: Android + Chrome. En PC también podés probar.');
    }
  }, [panel]);

  const applyPrefs = useCallback(
    (next: PanelNotificationPrefs) => {
      setPrefs(next);
      savePanelNotificationPrefs(panel, next, portalScope);
      void syncNotificationPrefsToServiceWorker(next);
    },
    [panel, portalScope],
  );

  useEffect(() => {
    void syncNotificationPrefsToServiceWorker(loadPanelNotificationPrefs(panel, portalScope));
  }, [panel, portalScope]);

  const previewTone = (toneId: PanelNotificationPrefs['tone']) => {
    const url = NOTIFICATION_TONES.find((t) => t.id === toneId)?.url;
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.7;
    void audio.play().catch(() => {});
  };

  const pushStatusLabel = (() => {
    if (!pushStatus) return null;
    if (pushStatus.ok) {
      const n = pushStatus.count;
      return {
        text:
          typeof n === 'number'
            ? `Push activo (${n} dispositivo${n === 1 ? '' : 's'})`
            : 'Push activo',
        tone: theme.accent,
      };
    }
    switch (pushStatus.reason) {
      case 'unauthorized':
        return { text: pushStatus.detail || 'Inicia sesión primero', tone: '#fbbf24' };
      case 'denied':
        return { text: pushStatus.detail || 'Permiso bloqueado en el navegador', tone: '#f87171' };
      case 'no_vapid':
        return { text: pushStatus.detail || 'Faltan claves VAPID en el servidor', tone: '#f87171' };
      case 'no_push':
        return { text: pushStatus.detail || 'Este navegador no soporta push', tone: '#f87171' };
      case 'timeout':
        return { text: pushStatus.detail || 'Tiempo agotado — reintentá', tone: '#fbbf24' };
      case 'pwa_disabled':
        return { text: 'PWA deshabilitada para este cliente', tone: '#f87171' };
      default:
        return {
          text: pushStatus.detail || `Error: ${pushStatus.reason}`,
          tone: '#fbbf24',
        };
    }
  })();

  async function sendTestPush() {
    if (!resellerId || !clientSlug) return;
    setTestingPush(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/portal/push/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId, clientSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestResult(data.error || 'Error al enviar prueba');
        return;
      }
      if ((data.sent ?? 0) === 0) {
        setTestResult('0 enviados. Primero ACTIVAR (debe decir 1 dispositivo).');
        return;
      }
      setTestResult(`Prueba enviada a ${data.sent}. ¿Te llegó?`);
    } catch {
      setTestResult('Error de conexión');
    } finally {
      setTestingPush(false);
    }
  }

  async function handleActivate() {
    if (!onRetryPush || activating) return;
    setActivating(true);
    setTestResult(null);
    try {
      await Promise.race([
        Promise.resolve(onRetryPush()),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 25000);
        }),
      ]);
    } catch {
      // ignore — status se muestra vía pushStatus
    } finally {
      setActivating(false);
    }
  }

  const isPortal = panel === 'portal';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto fixed bottom-4 left-4 z-[200] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg"
        style={{
          background: theme.bg,
          borderColor: theme.border,
          color: theme.accent,
          touchAction: 'manipulation',
        }}
        aria-label="Notificaciones"
      >
        {open ? <Settings className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      </button>

      {open ? (
        <div
          className="pointer-events-auto fixed bottom-[4.5rem] left-3 right-3 z-[200] mx-auto flex max-h-[min(70vh,520px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl sm:left-4 sm:right-auto"
          style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.accent }}>
              <Bell className="h-4 w-4" />
              Notificaciones
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: theme.muted, touchAction: 'manipulation' }}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
            {isPortal && platformHint ? (
              <p className="text-[11px] leading-relaxed" style={{ color: theme.muted }}>
                {platformHint}
              </p>
            ) : null}

            {/* Acciones primero — arriba y con área táctil grande */}
            {isPortal && onRetryPush ? (
              <div className="space-y-2">
                {pushStatusLabel ? (
                  <div
                    className="rounded-xl border px-3 py-2 text-[11px] leading-relaxed"
                    style={{ borderColor: `${pushStatusLabel.tone}44`, color: pushStatusLabel.tone }}
                  >
                    {pushStatusLabel.text}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleActivate()}
                  className="w-full rounded-xl py-3.5 text-sm font-bold active:opacity-80"
                  style={{
                    background: theme.accent,
                    color: '#0a0f1a',
                    touchAction: 'manipulation',
                    opacity: activating ? 0.75 : 1,
                  }}
                >
                  {activating
                    ? 'Activando… tocá de nuevo si se traba'
                    : pushStatus?.ok
                      ? 'Reactivar notificaciones'
                      : 'ACTIVAR NOTIFICACIONES'}
                </button>
              </div>
            ) : null}

            {isPortal && resellerId && clientSlug ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={testingPush}
                  onClick={() => void sendTestPush()}
                  className="w-full rounded-xl border py-3 text-xs font-semibold disabled:opacity-50"
                  style={{
                    borderColor: theme.border,
                    color: theme.accent,
                    touchAction: 'manipulation',
                  }}
                >
                  {testingPush ? 'Enviando…' : 'Probar alerta push'}
                </button>
                {testResult ? (
                  <p className="text-[10px]" style={{ color: theme.muted }}>
                    {testResult}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 border-t border-white/10 pt-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 opacity-70" />
                  Sonido
                </span>
                <input
                  type="checkbox"
                  checked={prefs.sound}
                  onChange={(e) => applyPrefs({ ...prefs, sound: e.target.checked })}
                  className="h-5 w-5 rounded"
                />
              </label>

              {prefs.sound ? (
                <label className="block">
                  <span className="mb-1 block text-xs" style={{ color: theme.muted }}>
                    Tono
                  </span>
                  <select
                    value={prefs.tone}
                    onChange={(e) => {
                      const tone = e.target.value as PanelNotificationPrefs['tone'];
                      applyPrefs({ ...prefs, tone });
                      previewTone(tone);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                  >
                    {NOTIFICATION_TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Vibrate className="h-4 w-4 opacity-70" />
                  Vibración
                </span>
                <input
                  type="checkbox"
                  checked={prefs.vibration}
                  onChange={(e) => applyPrefs({ ...prefs, vibration: e.target.checked })}
                  className="h-5 w-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 opacity-70" />
                  Badge
                </span>
                <input
                  type="checkbox"
                  checked={prefs.badge}
                  onChange={(e) => applyPrefs({ ...prefs, badge: e.target.checked })}
                  className="h-5 w-5 rounded"
                />
              </label>
            </div>

            <p className="pb-1 text-[10px] leading-relaxed" style={{ color: theme.muted }}>
              {isPortal
                ? '1) Login 2) ACTIVAR 3) Permitir. Debe decir “1 dispositivo”.'
                : 'Preferencias en este dispositivo.'}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
