'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneMockup from '@/components/PhoneMockup';
import { getStoredConfig, getDefaultConfig, getDuracionMinutos } from '@/src/lib/demo-config';
import type { DemoBusinessConfig } from '@/src/lib/demo-config';
import styles from './demo-barber.module.css';
import HeroPortada from './HeroPortada';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import { useBarber } from './barber-context';

const CalendarDemo = dynamic(() => import('./CalendarDemo'), { ssr: false });

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

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
  createdAt?: number;
};

function looksLikeTimeRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 4) return false;
  const timePatterns = [
    /\b(a\s+las|las\s+\d|horas?\s+\d|\d{1,2}\s*:\s*\d{2}|\d{1,2}\s*(am|pm|a\.?\s*m\.?|p\.?\s*m\.?))\b/i,
    /\b(hoy|mañana|pasado\s+mañana)\b/i,
    /\b(lunes|martes|miércoles|jueves|viernes|sábado|sabado|domingo)\b/i,
    /\b(\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))\b/i,
    /\b(en\s+la\s+mañana|por\s+la\s+tarde|al\s+mediodía)\b/i,
  ];
  return timePatterns.some((p) => p.test(t));
}
const COLOR_ESTETICA = '#8b5cf6';
const COLOR_UÑAS = '#06b6d4';
const COLOR_INFANTIL = '#f97316';
const COLOR_BARBERIA = '#0d9488';

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

function toUpper(str: string): string {
  return (str || '').trim().toUpperCase();
}

function TicketReservacion({ cita }: { cita: CitaData }) {
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
  const [config, setConfig] = useState<DemoBusinessConfig | null>(null);
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

function formatMessageTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function ChatHeaderWhatsApp({ loading, withIslandPadding }: { loading: boolean; withIslandPadding?: boolean }) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-white shrink-0 ${withIslandPadding ? 'pt-12' : ''}`}
      style={{ background: 'linear-gradient(180deg, #075e54 0%, #128c7e 100%)' }}
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 shrink-0 flex items-center justify-center">
        {!logoError ? (
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={40}
            height={40}
            className="object-cover w-full h-full"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-lg font-semibold text-white">A</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-[15px]">Agentia</p>
        <p className="text-xs text-white/80 truncate">
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

function DoubleCheckBlue() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.266c.162.156.373.241.601.241.23 0 .44-.085.601-.241l3.172-3.044a.365.365 0 0 0 .063-.51z" />
      <path d="M6.864 8.66a.32.32 0 0 0 .484-.032l.358-.325a.32.32 0 0 1 .484-.032l.378.48a.418.418 0 0 1-.036.54l-1.32 1.266a.877.877 0 0 1-.601.241.877.877 0 0 1-.601-.241L2.92 7.36a.365.365 0 0 1-.063-.51l.478-.372a.365.365 0 0 1 .51.063L6.864 8.66z" />
    </svg>
  );
}

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

function isTodayIso(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function nombreClienteDeTitulo(title: string): string {
  const idx = title.indexOf(' - ');
  return idx >= 0 ? title.slice(0, idx).trim() : title;
}

function servicioDeTitulo(title: string): string {
  const idx = title.lastIndexOf(' - ');
  return idx >= 0 ? title.slice(idx + 3).trim() : title;
}

function precioServicio(servicio: string, cfg: DemoBusinessConfig): number {
  const s = cfg.services.find((x) => x.name.toLowerCase() === servicio.toLowerCase());
  if (!s) return 0;
  const n = parseInt(String(s.price).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export default function DemoBarberPage() {
  const cfgStatic = getStoredConfig() || getDefaultConfig();
  const [config, setConfig] = useState<DemoBusinessConfig>(cfgStatic);
  useEffect(() => {
    setConfig(getStoredConfig() || getDefaultConfig());
  }, []);

  const { events, setEvents, paidIds, setPaidIds, lastAddedEventId, setLastAddedEventId } = useBarber();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const hasSimulatedConflict = useRef(false);
  const pendingCitaDraftRef = useRef<{
    clienteNombre: string;
    servicio: string;
    tipoNegocio: string;
  } | null>(null);
  const offeredSlotsRef = useRef<{ start: string; end: string }[] | null>(null);
  const [showPagarButton, setShowPagarButton] = useState(false);
  const [lastCitaId, setLastCitaId] = useState<string | null>(null);
  const [lastCitaData, setLastCitaData] = useState<CitaData | null>(null);
  const [payPhone, setPayPhone] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(768);
  const [activeTab, setActiveTab] = useState<'chat' | 'agenda'>('chat');

  useEffect(() => {
    if (!lastAddedEventId) return;
    const t = setTimeout(() => setLastAddedEventId(null), 2500);
    return () => clearTimeout(t);
  }, [lastAddedEventId, setLastAddedEventId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const addEvent = useCallback(
    (cita: CitaData) => {
      const cfg = getStoredConfig() || getDefaultConfig();
      const durationMin = getDuracionMinutos(cita.servicio, cfg);
      const start = new Date(cita.fechaHora);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
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
      setLastCitaData(cita);
      setLastAddedEventId(id);
      setShowPagarButton(true);
    },
    [setEvents, setLastAddedEventId]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text, createdAt: Date.now() }]);
    setLoading(true);
    try {
      const isFirstAppointmentRequest =
        !hasSimulatedConflict.current && looksLikeTimeRequest(text);
      const res = await fetch('/api/chat-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          existingEvents: events.map((e) => ({ start: e.start, end: e.end })),
          businessConfig: {
            capacidadSimultanea: config.capacidadSimultanea,
            services: config.services,
          },
          isFirstAppointmentRequest: isFirstAppointmentRequest || undefined,
          pendingCitaDraft: pendingCitaDraftRef.current ?? undefined,
          offeredSlots: offeredSlotsRef.current ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error ?? `Error ${res.status}. Intenta de nuevo.`;
        setMessages((prev) => [...prev, { role: 'assistant', content: errMsg, createdAt: Date.now() }]);
        return;
      }
      const reply = data?.reply ?? 'No pude procesar tu mensaje.';
      const cita = data?.cita ?? null;
      const showGallery = !!data?.showGallery;
      const conflictRejectedSlot = data?.conflictRejectedSlot as { start: string; end: string } | undefined;
      const offeredSlots = data?.offeredSlots as { start: string; end: string }[] | undefined;
      const pendingCitaDraft = data?.pendingCitaDraft as
        | { clienteNombre: string; servicio: string; tipoNegocio: string }
        | undefined;
      const clearPendingAlternatives = !!data?.clearPendingAlternatives;

      if (conflictRejectedSlot?.start && conflictRejectedSlot?.end) {
        hasSimulatedConflict.current = true;
        const id = `ocupado-${Date.now()}`;
        setEvents((prev) => [
          ...prev,
          {
            id,
            title: 'OCUPADO',
            start: conflictRejectedSlot.start,
            end: conflictRejectedSlot.end,
            backgroundColor: '#64748b',
            borderColor: '#475569',
            extendedProps: { tipoNegocio: 'Barbería', statusPago: 'ocupado', citaId: id },
          },
        ]);
      }
      if (offeredSlots && offeredSlots.length >= 2 && pendingCitaDraft) {
        offeredSlotsRef.current = offeredSlots;
        pendingCitaDraftRef.current = pendingCitaDraft;
      }
      if (cita || clearPendingAlternatives) {
        offeredSlotsRef.current = null;
        pendingCitaDraftRef.current = null;
      }

      const displayContent = cita ? stripConfirmacionCita(reply) : reply;
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            role: 'assistant' as const,
            content: displayContent,
            cita: cita || undefined,
            showGallery: showGallery || undefined,
            createdAt: Date.now(),
          },
        ];
        if (cita) {
          next.push({
            role: 'assistant',
            content: '¡TE ESPERAMOS! AQUÍ TIENES NUESTRA UBICACIÓN:',
            isLocation: true,
            createdAt: Date.now(),
          });
        }
        return next;
      });
      if (cita) addEvent(cita);
    } catch (e) {
      const isAbort = e instanceof Error && e.name === 'AbortError';
      const msg = isAbort
        ? 'La respuesta tardó demasiado. Intenta de nuevo.'
        : 'No pudimos conectar en este momento. Intenta de nuevo en unos segundos.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg, createdAt: Date.now() }]);
    } finally {
      setLoading(false);
    }
    setTimeout(scrollToBottom, 100);
  };

  const handlePagarAnticipo = async () => {
    if (!lastCitaId) return;
    setPaidIds((prev) => new Set(prev).add(lastCitaId));
    setShowPagarButton(false);
    setLastCitaId(null);
    const phone = payPhone.trim().replace(/\D/g, '');
    if (phone.length >= 10) {
      try {
        const res = await fetch('/api/demo/whatsapp-bienvenida', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            link: typeof window !== 'undefined' ? window.location.origin + '/dashboard' : undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn('[Demo] WhatsApp bienvenida:', data.error || res.status);
        }
      } catch (e) {
        console.warn('[Demo] Error enviando WhatsApp bienvenida:', e);
      }
    }
    setPayPhone('');
    setLastCitaData(null);
  };

  const kpi = useMemo(() => {
    const cfg = config;
    const now = new Date();
    const todayEv = events.filter((e) => isTodayIso(e.start) && !e.title.includes('OCUPADO'));
    const hasData = events.some((e) => !e.title.includes('OCUPADO'));

    const citasHoy = hasData ? todayEv.length : 8;

    const futuras = events
      .filter((e) => new Date(e.start) > now && !e.title.includes('OCUPADO'))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const prox = futuras[0];
    let proximaLabel = '11:30am · Carlos';
    if (hasData) {
      if (prox) {
        const t = new Date(prox.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        proximaLabel = `${t} · ${nombreClienteDeTitulo(prox.title)}`;
      } else {
        proximaLabel = '—';
      }
    }

    let ingresos = 1240;
    if (hasData) {
      ingresos = todayEv.reduce((acc, e) => {
        const srv = servicioDeTitulo(e.title);
        return acc + precioServicio(srv, cfg);
      }, 0);
    }

    const confirmadas = hasData ? todayEv.filter((e) => paidIds.has(e.id)).length : 3;

    return { citasHoy, proximaLabel, ingresos, confirmadas };
  }, [events, paidIds, config]);

  const chatBubbles = (
    <>
      {messages.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-4">Escribe para agendar tu cita.</p>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={`${i}-${m.content.slice(0, 12)}-${m.cita ? 'ticket' : ''}-${m.isLocation ? 'loc' : ''}`}
            variants={bubbleVariants}
            initial="initial"
            animate="animate"
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
          >
            <div
              className={`${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant} max-w-[85%] px-3 py-2 text-sm shadow-sm break-words`}
              style={
                m.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      marginLeft: 'auto',
                      color: '#fff',
                    }
                  : {
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.92)',
                    }
              }
            >
              {m.content ? <span>{m.content}</span> : null}
              {m.cita ? <TicketReservacion cita={m.cita} /> : null}
              {m.showGallery ? <GalleryPlaceholder /> : null}
              {m.isLocation ? <MapPreviewBlock /> : null}
              {m.role === 'assistant' && (m.content || m.cita || m.showGallery || m.isLocation) && (
                <div className={styles.bubbleMeta}>
                  <span className={styles.bubbleTime}>{formatMessageTime(m.createdAt)}</span>
                  <DoubleCheckBlue />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-2">
          <div
            className={`${styles.bubbleAssistant} rounded-[22px] rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-1 max-w-[85%]`}
            style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
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
    </>
  );

  return (
    <div className={`${styles.page} flex flex-col w-full min-h-screen overflow-y-auto relative`}>
      <div className={styles.meshBg} aria-hidden />

      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] px-2 md:px-6 py-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">IA activa — Responde en segundos</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Prueba el asistente de
            <br />
            <span className="text-teal-400">Barbería El Estilo</span>
          </h1>

          <p className="text-slate-400 text-lg">
            Intenta agendar una cita — el sistema detecta horarios ocupados en tiempo real y ofrece alternativas
            automáticamente. Pruébalo ahora.
          </p>

          <ul className="flex flex-col gap-3">
            {[
              'Detecta horarios ocupados automáticamente',
              'Ofrece alternativas cuando no hay disponibilidad',
              'La cita aparece en el calendario al instante',
              'Confirmación automática por WhatsApp',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300">
                <span className="text-green-400 font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => document.getElementById('panel-barber')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-slate-400 hover:text-white transition flex items-center gap-2 w-fit text-sm"
          >
            Ver calendario en vivo ↓
          </button>
        </div>

        <div className="flex justify-center relative z-10">
          <PhoneMockup
            businessName="Barbería El Estilo"
            businessEmoji="✂️"
            accentColor="#0d9488"
            apiRoute="/api/demo/barber/chat"
            initialMessage="¡Hola! ✂️ Soy el asistente de Barbería El Estilo. Intenta agendar una cita — te mostraré cómo funciono en tiempo real 😊"
            suggestedChips={[
              '🔴 Agendar en horario ocupado',
              '📅 Quiero una cita para mañana',
              '💈 ¿Qué servicios tienen?',
              '💰 ¿Cuánto cuesta un corte?',
            ]}
          />
        </div>
      </section>

      <div id="panel-barber" className="relative z-10 border-t border-white/10 px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h2 className="text-xl font-semibold text-white">Panel de administración</h2>
          <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-500/20 text-teal-400 border-teal-500/30">
            Vista interna del sistema
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Cuando el chat agenda una cita aparece en el calendario automáticamente. Pruébalo arriba.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 pb-6">
        {[
          {
            label: 'Citas hoy',
            color: 'text-teal-400',
            node: <AnimatedNumber value={kpi.citasHoy} decimals={0} />,
          },
          {
            label: 'Próxima cita',
            color: 'text-blue-400',
            node: <span className="text-lg font-bold tabular-nums leading-tight">{kpi.proximaLabel}</span>,
          },
          {
            label: 'Ingresos del día',
            color: 'text-emerald-400',
            node: (
              <AnimatedNumber
                value={kpi.ingresos}
                format={(n) =>
                  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
                    n
                  )
                }
              />
            ),
          },
          {
            label: 'Confirmadas',
            color: 'text-violet-400',
            node: <AnimatedNumber value={kpi.confirmadas} decimals={0} />,
          },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-slate-500 text-sm">{k.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${k.color}`}>{k.node}</p>
          </motion.div>
        ))}
      </div>

      <div className={`${styles.content} relative z-10 flex flex-1 min-w-0 gap-6 p-4 md:p-6`}>
        {isMobile && (
          <>
            <header className={styles.barberMobileHeader}>
              <span className={styles.barberMobileHeaderTitle}>{config.businessName || 'Agentia Barber'}</span>
              <a href={config.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.barberMobileHeaderBtn}>
                UBICACIÓN
              </a>
              <Link href="/admin/settings" className={styles.barberMobileHeaderBtn}>
                CONFIGURACIÓN
              </Link>
            </header>
            <div className={styles.heroMobileWrap}>
              <HeroPortada />
            </div>
            <div className={styles.barberTabs}>
              <button
                type="button"
                className={`${styles.barberTab} ${activeTab === 'chat' ? styles.barberTabActive : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <svg className={styles.barberTabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                CHAT
              </button>
              <button
                type="button"
                className={`${styles.barberTab} ${activeTab === 'agenda' ? styles.barberTabActive : ''}`}
                onClick={() => setActiveTab('agenda')}
              >
                <svg className={styles.barberTabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                AGENDA
              </button>
            </div>
            {activeTab === 'chat' && (
              <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col w-full max-w-lg mx-auto bg-slate-900/50 shadow-lg">
                <ChatHeaderWhatsApp loading={loading} />
                <div className={`${styles.mobileChatViewport} ${styles.chatWallpaper}`}>
                    {chatBubbles}
                    {showPagarButton && lastCitaId && (
                      <div className="pt-2 pb-2">
                        <p className="text-xs text-slate-400 mb-2">WhatsApp (opcional) para enviarte el acceso:</p>
                        <input
                          type="tel"
                          value={payPhone}
                          onChange={(e) => setPayPhone(e.target.value)}
                          placeholder="Ej: 52 55 1234 5678"
                          className="w-full rounded-xl px-3 py-2.5 text-sm bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                        />
                        <CheckoutSeguro onPagar={handlePagarAnticipo} />
                      </div>
                    )}
                </div>
                <div className={styles.mobileChatInputWrap}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 rounded-xl px-4 py-3 text-sm bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={loading}
                      className="rounded-full p-3 text-white disabled:opacity-50 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            )}
            {activeTab === 'agenda' && (
              <div className={styles.mobileAgendaColumn}>
                <div className={styles.mobileCalendarWrap}>
                  <CalendarDemo events={events} paidIds={paidIds} lastAddedEventId={lastAddedEventId} />
                </div>
              </div>
            )}
          </>
        )}

        {!isMobile && (
          <div className="flex flex-col lg:flex-row flex-1 gap-6 w-full min-w-0">
            <div className="flex-1 flex flex-col gap-4 min-w-0 max-w-xl lg:max-w-none">
              <HeroPortada />
              <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col w-full max-w-lg bg-slate-900/50 shadow-lg">
                <ChatHeaderWhatsApp loading={loading} />
                <div className={`h-[min(420px,50vh)] overflow-y-auto px-3 py-4 space-y-2 ${styles.chatWallpaper}`}>
                    {chatBubbles}
                    {showPagarButton && lastCitaId && (
                      <div className="px-0 py-2">
                        <p className="text-xs text-slate-400 mb-2">
                          WhatsApp (opcional) para enviarte el acceso a tu barbería:
                        </p>
                        <input
                          type="tel"
                          value={payPhone}
                          onChange={(e) => setPayPhone(e.target.value)}
                          placeholder="Ej: 52 55 1234 5678"
                          className="w-full rounded-xl px-3 py-2 text-sm bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                        />
                        <CheckoutSeguro onPagar={handlePagarAnticipo} />
                      </div>
                    )}
                  </div>
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

            <div className="flex-1 flex flex-col min-w-0 min-h-[480px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-white/95" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Calendario de citas
                </h2>
                <div className="flex items-center gap-3">
                  <Link href="/book" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition">
                    Reservar cita
                  </Link>
                  <Link href="/admin/settings" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition">
                    Configuración
                  </Link>
                </div>
              </div>
              <div className={`flex-1 min-h-0 overflow-hidden ${styles.glassCalendar}`}>
                <CalendarDemo events={events} paidIds={paidIds} lastAddedEventId={lastAddedEventId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
