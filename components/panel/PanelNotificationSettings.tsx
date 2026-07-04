'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Settings, Volume2, Vibrate, Hash } from 'lucide-react';
import {
  DEFAULT_PANEL_NOTIFICATION_PREFS,
  loadPanelNotificationPrefs,
  NOTIFICATION_TONES,
  savePanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
  type PanelNotificationPrefs,
} from '@/lib/panel-notification-prefs';

type PanelNotificationSettingsProps = {
  panel: 'cwf' | 'agentia';
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
} as const;

export function PanelNotificationSettings({ panel }: PanelNotificationSettingsProps) {
  const theme = BRAND[panel];
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<PanelNotificationPrefs>(DEFAULT_PANEL_NOTIFICATION_PREFS);

  useEffect(() => {
    setPrefs(loadPanelNotificationPrefs(panel));
  }, [panel]);

  const applyPrefs = useCallback(
    (next: PanelNotificationPrefs) => {
      setPrefs(next);
      savePanelNotificationPrefs(panel, next);
      void syncNotificationPrefsToServiceWorker(next);
    },
    [panel],
  );

  useEffect(() => {
    void syncNotificationPrefsToServiceWorker(loadPanelNotificationPrefs(panel));
  }, [panel]);

  const previewTone = (toneId: PanelNotificationPrefs['tone']) => {
    const url = NOTIFICATION_TONES.find((t) => t.id === toneId)?.url;
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.7;
    void audio.play().catch(() => {});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-lg border transition hover:scale-105"
        style={{
          background: theme.bg,
          borderColor: theme.border,
          color: theme.accent,
        }}
        aria-label="Configuración de notificaciones"
        title="Notificaciones"
      >
        {open ? <Settings className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      </button>

      {open ? (
        <div
          className="fixed bottom-20 left-4 z-50 w-[min(100vw-2rem,320px)] rounded-2xl border p-4 shadow-2xl"
          style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: theme.accent }}>
            <Bell className="h-4 w-4" />
            Notificaciones
          </h2>

          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 opacity-70" />
                Sonido
              </span>
              <input
                type="checkbox"
                checked={prefs.sound}
                onChange={(e) => applyPrefs({ ...prefs, sound: e.target.checked })}
                className="rounded"
              />
            </label>

            {prefs.sound ? (
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: theme.muted }}>
                  Tono
                </span>
                <select
                  value={prefs.tone}
                  onChange={(e) => {
                    const tone = e.target.value as PanelNotificationPrefs['tone'];
                    applyPrefs({ ...prefs, tone });
                    previewTone(tone);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-black/40 border border-white/10"
                >
                  {NOTIFICATION_TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2">
                <Vibrate className="h-4 w-4 opacity-70" />
                Vibración
              </span>
              <input
                type="checkbox"
                checked={prefs.vibration}
                onChange={(e) => applyPrefs({ ...prefs, vibration: e.target.checked })}
                className="rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2">
                <Hash className="h-4 w-4 opacity-70" />
                Badge (contador)
              </span>
              <input
                type="checkbox"
                checked={prefs.badge}
                onChange={(e) => applyPrefs({ ...prefs, badge: e.target.checked })}
                className="rounded"
              />
            </label>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed" style={{ color: theme.muted }}>
            Las preferencias se guardan en este dispositivo. Instala la app desde Chrome para recibir push.
          </p>
        </div>
      ) : null}
    </>
  );
}
