'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { AGENTIA_WHATSAPP_URL } from '@/lib/agentia-contact';

const WHATSAPP_URL = AGENTIA_WHATSAPP_URL;
const SESSION_KEY = 'agentia_exit_intent_seen_v1';

function isDesktopFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: fine)').matches ?? false;
}

export function GlobalWhatsAppAndExit() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Solo en landing principal y en /ready. Nunca en /portal, /dashboard, /admin, etc.
  const isAllowedPage = pathname === '/' || pathname === '/ready';

  // IMPORTANT: hooks MUST run on every render (Rules of Hooks).
  // Conditional rendering happens AFTER hooks, never before.
  const canShow = useMemo(() => {
    if (!isAllowedPage) return false;
    if (typeof window === 'undefined') return false;
    if (!isDesktopFinePointer()) return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return false;
    }
  }, [isAllowedPage]);

  useEffect(() => {
    if (!canShow) return;

    const onMouseOut = (e: MouseEvent) => {
      // Exit intent: cursor leaves top of viewport (not to another element)
      if (e.clientY > 0) return;
      const related = (e as any).relatedTarget;
      if (related) return;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      setOpen(true);
      document.removeEventListener('mouseout', onMouseOut);
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [canShow]);

  if (!isAllowedPage) return null;

  return (
    <>
      {/* WhatsApp fijo (todas las páginas) */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir WhatsApp"
        className="fixed right-4 bottom-4 z-[60] rounded-full shadow-xl"
        style={{
          width: 56,
          height: 56,
          background: '#25D366',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* WhatsApp icon (simple) */}
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 3C9.372 3 4 8.154 4 14.52c0 2.587.92 4.98 2.467 6.892L5 29l7.784-1.99A12.64 12.64 0 0 0 16 27.04c6.628 0 12-5.154 12-11.52C28 8.154 22.628 3 16 3Z"
            fill="#fff"
            opacity="0.95"
          />
          <path
            d="M22.54 18.92c-.28.77-1.63 1.42-2.23 1.5-.54.07-1.23.1-1.99-.12-.46-.14-1.05-.34-1.81-.67-3.19-1.35-5.27-4.5-5.43-4.71-.16-.21-1.29-1.67-1.29-3.19 0-1.52.82-2.27 1.11-2.58.28-.31.61-.38.82-.38h.59c.19 0 .45-.07.7.52.28.67.95 2.31 1.04 2.48.09.17.14.38.02.61-.12.23-.19.38-.37.58-.19.2-.4.44-.57.59-.19.16-.38.34-.16.67.23.33 1 1.59 2.15 2.58 1.48 1.27 2.73 1.67 3.13 1.85.4.17.63.14.86-.09.23-.23.99-1.12 1.26-1.5.28-.38.54-.31.91-.18.37.13 2.34 1.08 2.74 1.27.4.2.66.29.76.45.09.16.09.92-.19 1.69Z"
            fill="#0B141A"
          />
        </svg>
      </a>

      {/* Pop-up salida (1 vez por sesión) */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0e] text-white shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-white/70 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <p className="text-xl font-extrabold tracking-tight">¿Te vas sin ver la demo?</p>
            <p className="text-sm text-white/70 mt-2">Es gratis · Tarda 2 minutos · Sin tarjeta</p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/demo/barber"
                className="flex-1 text-center rounded-xl px-4 py-3 text-sm font-extrabold"
                style={{ background: '#CCFF00', color: '#000' }}
                onClick={() => setOpen(false)}
              >
                Ver demo ahora
              </Link>
              <button
                type="button"
                className="rounded-xl px-4 py-3 text-sm font-semibold border border-white/15 text-white/80 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

