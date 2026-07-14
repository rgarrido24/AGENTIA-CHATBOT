'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

const STORAGE_KEY = 'agentia_portal_pwa_banner_dismissed_until';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

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

function isDismissedInStorage(): boolean {
  try {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return false;
    const ts = Number(until);
    if (!Number.isFinite(ts)) return false;
    return Date.now() < ts;
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    // ignore
  }
}

type PortalPwaInstallBannerProps = {
  accent?: string;
};

/**
 * Banner opcional de instalación PWA.
 * - No bloquea la UI (pointer-events solo en el tip).
 * - Cierre con X → localStorage 7 días.
 * - En iOS: tooltip compacto inferior (nunca modal).
 */
export function PortalPwaInstallBanner({ accent = '#CCFF00' }: PortalPwaInstallBannerProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissedInStorage()) return;

    const iosDevice = isIos();
    setIos(iosDevice);

    // En iOS no existe beforeinstallprompt: tip opcional pequeño, con delay.
    // En Android/Chrome: solo si el navegador dispara beforeinstallprompt.
    if (iosDevice) {
      const t = window.setTimeout(() => setVisible(true), 1800);
      return () => window.clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = useCallback(() => {
    persistDismiss();
    setVisible(false);
    setDeferred(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // ignore
    }
    persistDismiss();
    setVisible(false);
    setDeferred(null);
  }, [deferred]);

  if (!visible) return null;
  if (!ios && !deferred) return null;

  return (
    // Contenedor NO bloquea taps: solo el tip captura eventos.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="pointer-events-auto relative flex max-w-[min(100%,340px)] items-start gap-2 rounded-2xl border px-3 py-2.5 shadow-lg"
        style={{
          background: 'rgba(10, 15, 26, 0.94)',
          borderColor: `${accent}40`,
          color: '#e2e8f0',
        }}
      >
        <div className="mt-0.5 shrink-0" style={{ color: accent }}>
          {ios ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <p className="text-[12px] font-semibold leading-snug" style={{ color: accent }}>
            {ios ? 'Opcional: añadir a inicio' : 'Opcional: instalar app'}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
            {ios
              ? 'Safari → Compartir → Añadir a pantalla de inicio. El portal funciona sin instalar.'
              : 'Puedes instalar el panel para alertas. No es obligatorio.'}
          </p>
          {!ios && deferred ? (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-2 rounded-lg px-3 py-1.5 text-[11px] font-bold"
              style={{ background: accent, color: '#0a0f1a' }}
            >
              Instalar
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso de instalación"
          className="absolute -right-1 -top-1 flex h-11 w-11 items-center justify-center rounded-full"
          style={{ color: '#94a3b8' }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>
    </div>
  );
}
