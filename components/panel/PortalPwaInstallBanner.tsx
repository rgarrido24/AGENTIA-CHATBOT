'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type PortalPwaInstallBannerProps = {
  accent?: string;
};

export function PortalPwaInstallBanner({ accent = '#CCFF00' }: PortalPwaInstallBannerProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIos(isIos());
    setStandalone(isStandalone());

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  if (standalone || dismissed) return null;

  if (ios) {
    return (
      <div
        className="fixed bottom-20 right-4 z-50 max-w-[min(100vw-2rem,300px)] rounded-2xl border p-4 shadow-2xl"
        style={{ background: 'rgba(10,15,26,0.97)', borderColor: `${accent}55`, color: '#e2e8f0' }}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: accent }}>
            <Smartphone className="h-4 w-4" />
            Instalar en iPhone
          </div>
          <button type="button" onClick={() => setDismissed(true)} aria-label="Cerrar">
            <X className="h-4 w-4 opacity-60" />
          </button>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          En Safari: botón <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong>.
          En iOS las notificaciones push del navegador son limitadas; en Android Chrome funcionan mejor.
        </p>
      </div>
    );
  }

  if (!deferred) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-50 max-w-[min(100vw-2rem,300px)] rounded-2xl border p-4 shadow-2xl"
      style={{ background: 'rgba(10,15,26,0.97)', borderColor: `${accent}55`, color: '#e2e8f0' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: accent }}>
          <Download className="h-4 w-4" />
          Instalar app
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Cerrar">
          <X className="h-4 w-4 opacity-60" />
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Instala el panel como app para recibir alertas de leads aunque no tengas la pestaña abierta.
      </p>
      <button
        type="button"
        onClick={() => void install()}
        className="w-full rounded-xl py-2.5 text-sm font-bold"
        style={{ background: accent, color: '#0a0f1a' }}
      >
        Instalar ahora
      </button>
    </div>
  );
}
