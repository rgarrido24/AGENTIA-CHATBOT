'use client';

import { useState } from 'react';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';

export default function WhatsAppFloat({
  productLabel,
  defaultMessage,
}: {
  productLabel: string;
  defaultMessage?: string;
}) {
  const [open, setOpen] = useState(false);

  const message =
    defaultMessage ?? `Hola, vengo de la página de ${productLabel} y quiero más información.`;
  const waLink = agentiaWhatsAppUrl(message);

  return (
    <div className="fixed bottom-5 left-4 z-50 flex items-end gap-2.5 sm:bottom-6 sm:left-6">
      {open ? (
        <div
          className="mb-1 w-[min(280px,calc(100vw-5.5rem))] rounded-2xl border border-white/10 p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]"
          style={{
            background: 'rgba(15,18,22,0.92)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <p className="mb-3 text-sm text-white/60">Escríbenos y te respondemos en minutos.</p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-[#06210f] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px active:scale-[0.97]"
          >
            Abrir WhatsApp
          </a>
        </div>
      ) : null}
      <button
        type="button"
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_30px_-6px_rgba(37,211,102,0.55)] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-105 active:scale-[0.97]"
        aria-label="Abrir chat de WhatsApp"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l4.93-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
            fill="#06210f"
          />
          <path
            d="M8.5 8c.2-.4.5-.4.7-.4h.6c.2 0 .4 0 .6.4.2.5.7 1.7.7 1.9s0 .3-.1.5c-.1.2-.2.3-.4.5-.2.2-.4.4-.2.7.2.4.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.7 1.6.4.2.6.1.8-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1s.5.2.6.4c.1.2.1.9-.2 1.7-.3.8-1.7 1.6-2.4 1.7-.6.1-1.4.2-4.6-1s-5.3-4.6-5.5-4.9c-.2-.2-1.4-1.9-1.4-3.6 0-1.7.9-2.5 1.2-2.9z"
            fill="#25d366"
          />
        </svg>
      </button>
    </div>
  );
}
