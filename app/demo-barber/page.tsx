'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { CalendarEvent } from './CalendarDemo';
import { getStoredConfig, getDefaultConfig } from '@/src/lib/demo-config';
import styles from './demo-barber.module.css';
import HeroPortada from './HeroPortada';

const CalendarDemo = dynamic(() => import('./CalendarDemo'), { ssr: false });

export type CitaData = {
  clienteNombre: string;
  servicio: string;
  fechaHora: string;
  tipoNegocio: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  cita?: CitaData | null;
  showGallery?: boolean;
  isLocation?: boolean;
};

const COLOR_BARBERIA = '#2563eb';
const COLOR_ESTETICA = '#8b5cf6';
const COLOR_UÑAS = '#06b6d4';
const COLOR_INFANTIL = '#f97316';

function getEventColor(tipoNegocio: string): string {
  const t = (tipoNegocio || '').toLowerCase();
  if (t.includes('uña') || t.includes('unas')) return COLOR_UÑAS;
  if (t.includes('estética') || t.includes('estetica')) return COLOR_ESTETICA;
  if (t.includes('infantil')) return COLOR_INFANTIL;
  if (t.includes('barber')) return COLOR_BARBERIA;
  return '#64748b';
}

function stripConfirmacionCita(text: string): string {
  const idx = text.indexOf('CONFIRMACION_CITA:');
  if (idx === -1) return text.trim();
  const before = text.slice(0, idx).trim();
  const after = text.slice(idx);
  const start = after.indexOf('{');
  if (start === -1) return before || '';
  let depth = 0;
  let end = -1;
  for (let i = start; i < after.length; i++) {
    if (after[i] === '{') depth++;
    else if (after[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const rest = end !== -1 ? after.slice(end + 1).trim() : '';
  return (before + (rest ? ' ' + rest : '')).trim() || '';
}

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

function TicketReservacion({ cita }: { cita: CitaData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={styles.ticketCard}
    >
      <div className={styles.ticketTitle}>Reserva confirmada</div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Cliente</span>
        <span>{cita.clienteNombre}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Servicio</span>
        <span>{cita.servicio}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Fecha y hora</span>
        <span>{formatTicketDate(cita.fechaHora)}</span>
      </div>
      <div className={styles.ticketRow}>
        <span className={styles.ticketRowLabel}>Tipo</span>
        <span>{cita.tipoNegocio}</span>
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

function GalleryPlaceholder() {
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

function MapPreviewBlock() {
  const [config, setConfig] = useState<ReturnType<typeof getStoredConfig>>(null);
  useEffect(() => {
    setConfig(getStoredConfig() || getDefaultConfig());
  }, []);
  if (!config) return null;
  return (
    <div className={styles.mapPreview}>
      <a
        href={config.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full bg-slate-800/80 flex items-center justify-center text-emerald-400 hover:bg-slate-700/80 transition text-sm font-medium"
      >
        Ver en Google Maps · {config.address}
      </a>
    </div>
  );
}

const bubbleVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};

function CheckoutSeguro({ onPagar, disabled }: { onPagar: () => void; disabled?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.checkoutCard}
      style={{ padding: 16, marginTop: 8 }}
    >
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Transacción Encriptada SSL</span>
      </div>
      <div className={`flex items-center gap-4 mb-4 ${styles.paymentLogos}`}>
        <span className="text-xs font-medium text-slate-500">Visa</span>
        <span className="text-xs font-medium text-slate-500">Mastercard</span>
        <span className="text-xs font-medium text-slate-500">Apple Pay</span>
      </div>
      <button
        type="button"
        onClick={onPagar}
        disabled={disabled}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition hover:opacity-95 disabled:opacity-50"
        style={{ background: '#22c55e' }}
      >
        PAGAR ANTICIPO
      </button>
    </motion.div>
  );
}

export default function DemoBarberPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [showPagarButton, setShowPagarButton] = useState(false);
  const [lastCitaId, setLastCitaId] = useState<string | null>(null);
  const [lastAddedEventId, setLastAddedEventId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastAddedEventId) return;
    const t = setTimeout(() => setLastAddedEventId(null), 2500);
    return () => clearTimeout(t);
  }, [lastAddedEventId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const addEvent = useCallback((cita: CitaData) => {
    const start = new Date(cita.fechaHora);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const id = `cita-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const color = getEventColor(cita.tipoNegocio);
    setEvents((prev) => [
      ...prev,
      {
        id,
        title: `${cita.clienteNombre} - ${cita.servicio}`,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: color,
        borderColor: color,
        extendedProps: { tipoNegocio: cita.tipoNegocio, statusPago: 'pendiente', citaId: id },
      },
    ]);
    setLastCitaId(id);
    setLastAddedEventId(id);
    setShowPagarButton(true);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error ?? `Error ${res.status}. Intenta de nuevo.`;
        setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
        return;
      }
      const reply = data?.reply ?? 'No pude procesar tu mensaje.';
      const cita = data?.cita ?? null;
      const showGallery = !!data?.showGallery;
      const displayContent = cita ? stripConfirmacionCita(reply) : reply;
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            role: 'assistant' as const,
            content: displayContent,
            cita: cita || undefined,
            showGallery: showGallery || undefined,
          },
        ];
        if (cita) {
          next.push({
            role: 'assistant',
            content: '¡TE ESPERAMOS! AQUÍ TIENES NUESTRA UBICACIÓN:',
            isLocation: true,
          });
        }
        return next;
      });
      if (cita) addEvent(cita);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
    setTimeout(scrollToBottom, 100);
  };

  const handlePagarAnticipo = () => {
    if (!lastCitaId) return;
    setPaidIds((prev) => new Set(prev).add(lastCitaId));
    setShowPagarButton(false);
    setLastCitaId(null);
  };

  return (
    <div className={`${styles.page} flex h-screen w-full overflow-hidden`}>
      <div className={styles.meshBg} aria-hidden />
      <div className={`${styles.content} flex flex-1 min-w-0 gap-6 p-6`}>
        <div className="flex flex-col items-center flex-shrink-0 w-full max-w-[380px]">
          <div className={styles.iphoneFrame}>
            <div className={`${styles.iphoneInner} ${styles.glassPhone} relative w-full max-w-[340px]`}>
              <div
                className={`${styles.dynamicIsland} ${loading ? styles.dynamicIslandActive : ''}`}
                aria-hidden
              >
                {loading && (
                  <span className="text-[10px] text-emerald-400 font-medium">Procesando...</span>
                )}
              </div>
              <div
                className="flex items-center gap-3 px-4 pt-12 pb-3 text-white"
                style={{ background: 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)' }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">Agentia</p>
                  <p className="text-xs opacity-90">Resolutivo 24/7</p>
                </div>
              </div>
              <div
                className="h-[380px] overflow-y-auto px-3 py-4 space-y-2"
                style={{ background: 'rgba(15, 23, 42, 0.92)' }}
              >
                {messages.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">
                    Escribe para agendar tu cita.
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={`${i}-${m.content.slice(0, 12)}-${m.cita ? 'ticket' : ''}-${m.isLocation ? 'loc' : ''}`}
                      variants={bubbleVariants}
                      initial="initial"
                      animate="animate"
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm break-words"
                        style={
                          m.role === 'user'
                            ? {
                                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                marginLeft: 'auto',
                                color: '#fff',
                              }
                            : {
                                background: 'rgba(30, 41, 59, 0.9)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.92)',
                              }
                        }
                      >
                        {m.content ? <span>{m.content}</span> : null}
                        {m.cita ? <TicketReservacion cita={m.cita} /> : null}
                        {m.showGallery ? <GalleryPlaceholder /> : null}
                        {m.isLocation ? <MapPreviewBlock /> : null}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm flex items-center gap-1"
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-slate-400 text-xs mr-1">Escribiendo</span>
                      <span className={styles.typingDots}>
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {showPagarButton && lastCitaId && (
                <div
                  className="px-3 py-3 border-t border-white/10"
                  style={{ background: 'rgba(15, 23, 42, 0.95)' }}
                >
                  <CheckoutSeguro onPagar={handlePagarAnticipo} />
                </div>
              )}
              <div
                className="flex gap-2 px-3 py-3 border-t border-white/10"
                style={{ background: 'rgba(15, 23, 42, 0.95)' }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="rounded-full p-2.5 text-white disabled:opacity-50 transition"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
                  aria-label="Enviar"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <HeroPortada />
          <div className="flex items-center justify-between mb-3">
            <h1
              className="text-xl font-semibold text-white/95"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Calendario de citas
            </h1>
            <Link
              href="/admin/settings"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
            >
              Configuración
            </Link>
          </div>
          <div className={`flex-1 min-h-0 overflow-hidden ${styles.glassCalendar}`}>
            <CalendarDemo
              events={events}
              paidIds={paidIds}
              lastAddedEventId={lastAddedEventId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
