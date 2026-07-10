'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IZZI_MERIDA_WA } from '@/lib/izzi-brand';

const DISMISS_KEY = 'izzi_merida_popup_dismissed';

export function WhatsAppPromoPopup() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }

    const delay = reduceMotion ? 1500 : 4000;
    const id = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-labelledby="izzi-promo-title"
            aria-modal="true"
            className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-sm sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0a0a0a] shadow-[0_0_60px_rgba(0,177,64,0.2)]">
              <div className="relative bg-gradient-to-br from-[#00B140]/20 via-transparent to-[#f472b6]/10 px-6 pb-5 pt-6">
                <button
                  type="button"
                  onClick={dismiss}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00B140]/40 bg-[#00B140]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#00B140]">
                  <Zap className="h-3 w-3" />
                  Tiempo limitado
                </span>
                <h2 id="izzi-promo-title" className="mt-4 text-xl font-extrabold leading-tight text-white">
                  ¡Aprovecha la promo antes de que termine!
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  1er mes a <span className="font-bold text-[#f472b6]">$100</span> · instalación{' '}
                  <span className="font-bold text-[#00B140]">sin costo</span> · 120 Mbps en Mérida
                </p>
              </div>
              <div className="px-6 pb-6">
                <a
                  href={IZZI_MERIDA_WA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 text-base font-extrabold text-white shadow-[0_0_32px_rgba(37,211,102,0.4)] transition hover:scale-[1.02] active:scale-[0.98]"
                  onClick={dismiss}
                >
                  <MessageCircle className="h-5 w-5" />
                  Escribir por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={dismiss}
                  className="mt-3 w-full text-center text-xs text-white/40 transition hover:text-white/60"
                >
                  Ahora no, gracias
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
