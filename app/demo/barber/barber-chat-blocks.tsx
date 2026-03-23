'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  getStoredConfig,
  getDefaultConfig,
  type DemoBusinessConfig,
} from '@/src/lib/demo-config';
import styles from './demo-barber.module.css';
import type { CitaData } from './barber-chat-types';

export function formatMessageTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function TicketReservacion({ cita }: { cita: CitaData }) {
  function formatTicketDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
  function toUpper(str: string): string {
    return (str || '').trim().toUpperCase();
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={styles.ticketCard}
    >
      <div className={styles.ticketTitle}>RESERVA CONFIRMADA</div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Cliente</span>
        <span>{toUpper(cita.clienteNombre)}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Servicio</span>
        <span>{toUpper(cita.servicio)}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Fecha y hora</span>
        <span>{toUpper(formatTicketDate(cita.fechaHora))}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Tipo</span>
        <span>{toUpper(cita.tipoNegocio)}</span>
      </div>
      <div className={styles.ticketDivider} />
      <div className={styles.ticketQR}>QR</div>
    </motion.div>
  );
}

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200',
  'https://images.unsplash.com/photo-1560066984-138dadb4e035?w=200',
];

export function GalleryPlaceholder() {
  return (
    <div className={styles.galleryWrap}>
      {GALLERY_IMAGES.map((src, i) => (
        <a
          key={i}
          href={src.replace('w=200', 'w=800')}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img src={src} alt="" className={styles.galleryImg} />
        </a>
      ))}
    </div>
  );
}

export function MapPreviewBlock() {
  const [cfg, setCfg] = useState<DemoBusinessConfig | null>(null);
  useEffect(() => {
    setCfg(getStoredConfig() || getDefaultConfig());
  }, []);
  if (!cfg) return null;
  return (
    <div className={styles.mapPreview}>
      <a
        href={cfg.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full bg-slate-800/80 flex items-center justify-center text-emerald-400 hover:bg-slate-700/80 transition text-sm font-medium"
      >
        Ver en Google Maps · {cfg.address}
      </a>
    </div>
  );
}

export function ChatHeaderWhatsApp({ loading }: { loading: boolean }) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 text-white shrink-0"
      style={{ background: 'linear-gradient(180deg, #075e54 0%, #128c7e 100%)' }}
    >
      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 flex items-center justify-center">
        {!logoError ? (
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={36}
            height={36}
            className="object-cover w-full h-full"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-base font-semibold text-white">A</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-[12px]">Agentia</p>
        <p className="text-[10px] text-white/80 truncate">
          {loading ? (
            <span className="inline-flex items-center gap-0.5">
              Escribiendo
              <span className={styles.typingDots}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          ) : (
            'Resolutivo 24/7'
          )}
        </p>
      </div>
    </div>
  );
}

export function DoubleCheckBlue() {
  return (
    <svg className="w-3 h-3 shrink-0 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.266c.162.156.373.241.601.241.23 0 .44-.085.601-.241l3.172-3.044a.365.365 0 0 0 .063-.51z" />
      <path d="M6.864 8.66a.32.32 0 0 0 .484-.032l.358-.325a.32.32 0 0 1 .484-.032l.378.48a.418.418 0 0 1-.036.54l-1.32 1.266a.877.877 0 0 1-.601.241.877.877 0 0 1-.601-.241L2.92 7.36a.365.365 0 0 1-.063-.51l.478-.372a.365.365 0 0 1 .51.063L6.864 8.66z" />
    </svg>
  );
}

export function CheckoutSeguro({ onPagar, disabled }: { onPagar: () => void; disabled?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.checkoutCard}
      style={{ padding: 12, marginTop: 8 }}
    >
      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Transacción Encriptada SSL</span>
      </div>
      <button
        type="button"
        onClick={onPagar}
        disabled={disabled}
        className="w-full py-2 rounded-lg font-semibold text-white text-[11px] transition hover:opacity-95 disabled:opacity-50"
        style={{ background: '#22c55e' }}
      >
        PAGAR ANTICIPO
      </button>
    </motion.div>
  );
}
