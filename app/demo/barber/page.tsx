'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import BarberPhoneMockup from '@/components/BarberPhoneMockup';
import { getStoredConfig, getDefaultConfig, getDuracionMinutos } from '@/src/lib/demo-config';
import type { DemoBusinessConfig } from '@/src/lib/demo-config';
import styles from './demo-barber.module.css';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import { useBarber } from './barber-context';
import { GIRO_CONFIGS } from './giro-config';
import type { ChatMessage, CitaData } from './barber-chat-types';
import type { LoyaltyCardData } from './LoyaltyCard';
import { useAnalytics } from '@/src/lib/analytics-client';

export type { CitaData } from './barber-chat-types';

// Loyalty mock data for demo (hardcoded)
const DEMO_LOYALTY: Record<string, { visitas: number; clienteId: string }> = {
  barberia: { visitas: 3, clienteId: 'C-0042' },
  nail: { visitas: 2, clienteId: 'N-0018' },
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
  useAnalytics('barber');
  const cfgStatic = getStoredConfig() || getDefaultConfig();
  const [config, setConfig] = useState<DemoBusinessConfig>(cfgStatic);
  useEffect(() => {
    setConfig(getStoredConfig() || getDefaultConfig());
  }, []);

  const { events, setEvents, paidIds, setPaidIds, lastAddedEventId, setLastAddedEventId, giro } = useBarber();
  const giroCfg = giro ? GIRO_CONFIGS[giro] : null;
  const isNail = giro === 'nail';

  // Build initial messages: returning client recognition + welcome
  const buildInitialMessages = useCallback((): ChatMessage[] => {
    if (!giroCfg) return [];
    const c = giroCfg.clienteRegreso;
    const greet = giro === 'barberia'
      ? `Hola ${c.nombre} 👋 La última vez te hicimos *${c.ultimoServicio}* con ${c.ultimoArtista}. ¿Repetimos o quieres cambiar algo?`
      : `Hola ${c.nombre} 💅 La última vez te hicimos *${c.ultimoServicio}* con ${c.ultimoArtista}. ¿Repetimos o quieres algo diferente?`;
    return [{ role: 'assistant', content: greet, createdAt: Date.now() }];
  }, [giro, giroCfg]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages());
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const hasSimulatedConflict = useRef<boolean>(false);
  const pendingCitaDraftRef = useRef<{
    clienteNombre: string;
    servicio: string;
    tipoNegocio: string;
  } | null>(null);
  const offeredSlotsRef = useRef<{ start: string; end: string }[] | null>(null);
  const [showPagarButton, setShowPagarButton] = useState<boolean>(false);
  const [lastCitaId, setLastCitaId] = useState<string | null>(null);
  const [payPhone, setPayPhone] = useState<string>('');

  useEffect(() => {
    if (!lastAddedEventId) return;
    const t = setTimeout(() => setLastAddedEventId(null), 2500);
    return () => clearTimeout(t);
  }, [lastAddedEventId, setLastAddedEventId]);

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
      setLastAddedEventId(id);
      setShowPagarButton(true);
    },
    [setEvents, setLastAddedEventId]
  );

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const raw = overrideText !== undefined ? overrideText : input;
      const text = raw.trim();
      if (!text || loading) return;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: text, createdAt: Date.now() }]);

      // Local intercept: loyalty card keywords
      if (giroCfg && /mis\s*puntos?|mi\s*tarjeta|lealtad|puntos/i.test(text)) {
        const demo = DEMO_LOYALTY[giro ?? 'barberia'] ?? { visitas: 3, clienteId: 'C-0042' };
        const cardData: LoyaltyCardData = {
          clienteNombre: giroCfg.clienteRegreso.nombre,
          clienteId: demo.clienteId,
          negocio: giroCfg.nombre,
          giro: giroCfg.id,
          visitas: demo.visitas,
          meta: giroCfg.metaVisitas,
          ultimoServicio: giroCfg.clienteRegreso.ultimoServicio,
          recompensaNombre: giroCfg.recompensaNombre,
        };
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            loyaltyCard: cardData,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      // Local intercept: "repetir mismo servicio"
      if (giroCfg && /repetir|mismo\s*servicio|igual\s*que\s*siempre/i.test(text)) {
        const c = giroCfg.clienteRegreso;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `¡Perfecto! Te agendamos *${c.ultimoServicio}* con ${c.ultimoArtista}, igual que la última vez. ¿Cuándo te queda bien? Escríbeme un día y hora 📅`,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

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
    },
    [input, loading, messages, events, config, addEvent, setEvents, giro, giroCfg]
  );

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

  return (
    <div className={`${styles.page} flex flex-col w-full min-h-screen overflow-y-auto relative`}>
      <div
        className={styles.meshBg}
        style={isNail ? { background: 'linear-gradient(165deg, #fff0f7 0%, #fce7f3 35%, #fbcfe8 70%, #fce7f3 100%)' } : undefined}
        aria-hidden
      />

      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] px-2 md:px-6 py-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">IA activa — Responde en segundos</span>
          </div>

          <h1 className={`text-4xl font-bold leading-tight ${isNail ? 'text-pink-900' : 'text-white'}`}>
            Prueba el asistente de
            <br />
            <span style={{ color: giroCfg?.acento ?? '#0d9488' }}>
              {giroCfg?.nombre ?? 'Barbería El Estilo'}
            </span>
          </h1>

          <p className={`text-lg ${isNail ? 'text-zinc-600' : 'text-slate-400'}`}>
            {giroCfg?.id === 'nail'
              ? 'Agenda citas de uñas — el sistema detecta disponibilidad en tiempo real y confirma automáticamente. Pruébalo ahora.'
              : 'Intenta agendar una cita — el sistema detecta horarios ocupados en tiempo real y ofrece alternativas automáticamente.'}
          </p>

          <ul className="flex flex-col gap-3">
            {[
              'Detecta horarios ocupados automáticamente',
              'Ofrece alternativas cuando no hay disponibilidad',
              'La cita aparece en el calendario al instante',
              'Confirmación automática por WhatsApp',
            ].map((item) => (
              <li key={item} className={`flex items-center gap-3 ${isNail ? 'text-zinc-700' : 'text-slate-300'}`}>
                <Check className="w-4 h-4 text-green-400 shrink-0" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/demo/barber/agenda"
              className="text-slate-400 hover:text-white transition flex items-center gap-2 w-fit text-sm"
            >
              Ver agenda semanal ↓
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('kpi-barber')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-slate-400 hover:text-white transition flex items-center gap-2 w-fit text-sm"
            >
              Ver métricas del día ↓
            </button>
          </div>
        </div>

        <div className="flex justify-center relative z-10">
          <BarberPhoneMockup
            businessName={giroCfg?.nombre ?? 'Barbería El Estilo'}
            businessEmoji={giroCfg?.emoji ?? '✂️'}
            accentColor={giroCfg?.acento ?? '#0d9488'}
            initialMessage={giroCfg?.welcomeMsg ?? '¡Hola! ✂️ Soy tu asistente. Intenta agendar una cita 😊'}
            suggestedChips={
              giroCfg
                ? [
                    `Repetir ${giroCfg.clienteRegreso.ultimoServicio}`,
                    ...giroCfg.chipsCliente.slice(0, 4),
                  ]
                : ['Quiero cita mañana', '¿Qué horarios tienen?', '¿Cuánto cuesta?']
            }
            messages={messages}
            input={input}
            loading={loading}
            onInputChange={(val) => setInput(val)}
            onSend={(text) => {
              void handleSend(text);
            }}
            showPagarButton={showPagarButton && !!lastCitaId}
            payPhone={payPhone}
            onPayPhoneChange={(v) => setPayPhone(v)}
            onPagarAnticipo={() => void handlePagarAnticipo()}
          />
        </div>
      </section>

      <div id="kpi-barber" className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 py-8 pb-12">
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
            className={`rounded-xl border p-5 ${isNail ? 'border-pink-200 bg-white shadow-sm' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <p className={`text-sm ${isNail ? 'text-zinc-500' : 'text-slate-500'}`}>{k.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${k.color}`}>{k.node}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
