'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Shield, Sparkles } from 'lucide-react';

type RoomStatus = 'vacante' | 'ocupado' | 'limpieza';
type ChatSender = 'user' | 'ai';

type ChatItem =
  | { type: 'message'; sender: ChatSender; text: string }
  | { type: 'typing'; sender: 'ai'; ms: number }
  | { type: 'image'; sender: 'user'; label: string }
  | { type: 'event'; name: 'assign_room_105' };

const EMERALD = '#50C878';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function buildRooms(): Array<{ id: number; status: RoomStatus }> {
  const ids = [
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 201, 202, 203, 204, 205, 206, 207, 208,
    209, 210,
  ];
  const preset: Record<number, RoomStatus> = {
    103: 'ocupado',
    204: 'ocupado',
    209: 'limpieza',
  };
  return ids.map((id) => ({ id, status: preset[id] ?? 'vacante' }));
}

function statusLabel(s: RoomStatus) {
  if (s === 'vacante') return 'Vacante';
  if (s === 'ocupado') return 'Ocupado';
  return 'Limpieza';
}

function statusColor(s: RoomStatus) {
  if (s === 'vacante') return EMERALD;
  if (s === 'ocupado') return '#ef4444';
  return '#f59e0b';
}

const SCRIPT: ChatItem[] = [
  { type: 'message', sender: 'user', text: 'Hola, quiero hacer el check-in para mi reserva.' },
  { type: 'typing', sender: 'ai', ms: 1200 },
  {
    type: 'message',
    sender: 'ai',
    text:
      '¡Hola! Bienvenido a Esmeralda Breeze. 🌊\n' +
      'Veo tu reserva a nombre de Carlos Ortiz.\n' +
      '¿Me podrías enviar una foto de tu identificación para completar el registro?',
  },
  { type: 'typing', sender: 'ai', ms: 650 },
  { type: 'image', sender: 'user', label: 'ID_Carlos_Ortiz.jpg' },
  { type: 'typing', sender: 'ai', ms: 1350 },
  {
    type: 'message',
    sender: 'ai',
    text:
      'Gracias Carlos. Registro completado.\n' +
      'Tu habitación es la 105. La cerradura digital ya está activa.\n' +
      '¿Deseas pedir algo del minibar para tu llegada?',
  },
  { type: 'event', name: 'assign_room_105' },
  { type: 'message', sender: 'user', text: 'Sí, un agua mineral y una cerveza por favor.' },
  { type: 'typing', sender: 'ai', ms: 1100 },
  { type: 'message', sender: 'ai', text: 'Entendido. Cargado a tu cuenta ($8 USD). Disfruta tu estancia.' },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.075s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
    </div>
  );
}

function WhatsAppIPhone({
  items,
  isTyping,
}: {
  items: Array<Extract<ChatItem, { type: 'message' | 'image' }>>;
  isTyping: boolean;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div
        className="relative overflow-hidden rounded-[46px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_30px_90px_-45px_rgba(80,200,120,0.35)] backdrop-blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(80,200,120,0.14), transparent 55%), rgba(255,255,255,0.04)',
        }}
      >
        {/* iPhone frame */}
        <div className="relative rounded-[38px] bg-[#06070b] ring-1 ring-white/10">
          <div className="absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-black/60 ring-1 ring-white/5" />
          {/* WhatsApp top bar */}
          <div className="flex items-center gap-3 px-4 pt-10 pb-3">
            <div className="h-9 w-9 rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/30" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Esmeralda Breeze</p>
              <p className="text-[11px] text-zinc-500">en línea • Agentia IA</p>
            </div>
          </div>
          <div className="h-px bg-white/5" />

          {/* Chat */}
          <div className="h-[480px] overflow-y-auto px-3 py-4">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-emerald-300/80" aria-hidden />
              Check-in seguro
            </div>

            {items.map((m, idx) => {
              const mine = m.sender === 'user';
              if (m.type === 'image') {
                return (
                  <div key={idx} className={cx('mb-2 flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cx(
                        'max-w-[82%] rounded-2xl border px-3 py-2 text-sm shadow-sm',
                        mine
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-white'
                          : 'border-white/10 bg-white/[0.06] text-zinc-100'
                      )}
                    >
                      <div className="mb-2 aspect-[4/3] w-[210px] max-w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                            Imagen • {m.label}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400">{mine ? 'Enviado' : 'Recibido'}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className={cx('mb-2 flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cx(
                      'max-w-[82%] whitespace-pre-wrap rounded-2xl border px-3 py-2 text-[13px] leading-relaxed shadow-sm',
                      mine
                        ? 'border-emerald-400/25 bg-emerald-400/10 text-white'
                        : 'border-white/10 bg-white/[0.06] text-zinc-100'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="mb-2 flex justify-start">
                <div className="max-w-[72%] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/5 px-3 py-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400/80" />
              <p className="text-xs text-zinc-500">Escribe un mensaje…</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Demo WhatsApp • burbujas con timing real (simulado)
      </p>
    </div>
  );
}

export default function EsmeraldaBreezeDemoPage() {
  const reduceMotion = useReducedMotion();
  const [rooms, setRooms] = useState(() => buildRooms());
  const [chat, setChat] = useState<Array<Extract<ChatItem, { type: 'message' | 'image' }>>>([]);
  const [typing, setTyping] = useState(false);

  const timers = useRef<number[]>([]);
  const assigned105 = useRef(false);

  const motionIn = useMemo(
    () => ({
      initial: reduceMotion ? false : { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { type: 'spring', stiffness: 260, damping: 26 },
    }),
    [reduceMotion]
  );

  useEffect(() => {
    // Limpieza
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    // Arrancar script una sola vez
    let at = 450;
    for (const step of SCRIPT) {
      if (step.type === 'typing') {
        const on = window.setTimeout(() => setTyping(true), at);
        timers.current.push(on);
        at += Math.max(250, step.ms);
        const off = window.setTimeout(() => setTyping(false), at);
        timers.current.push(off);
        continue;
      }

      if (step.type === 'event') {
        const t = window.setTimeout(() => {
          if (step.name === 'assign_room_105' && !assigned105.current) {
            assigned105.current = true;
            setRooms((prev) =>
              prev.map((r) => (r.id === 105 ? { ...r, status: 'ocupado' } : r))
            );
          }
        }, at);
        timers.current.push(t);
        continue;
      }

      const t = window.setTimeout(() => {
        setChat((prev) => [...prev, step]);
      }, at);
      timers.current.push(t);
      at += step.type === 'image' ? 900 : 760;
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#030508] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(80, 200, 120, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.10), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(168, 85, 247, 0.08), transparent 45%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div {...motionIn} className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white sm:text-xl">
              Control Operativo — Esmeralda Breeze
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Dashboard demo • asignación de habitación desde WhatsApp (IA)
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-xl">
              <Sparkles className="h-4 w-4" aria-hidden />
              IA Agentia Active
            </span>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Dashboard (70%) */}
          <motion.section
            {...motionIn}
            className="w-full lg:w-[70%] rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-200">Habitaciones</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: EMERALD }} />
                  Vacante
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Ocupado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Limpieza
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {rooms.map((r) => {
                const is105 = r.id === 105;
                const c = statusColor(r.status);
                return (
                  <motion.div
                    key={r.id}
                    layout
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    className={cx(
                      'relative overflow-hidden rounded-2xl border bg-black/20 p-4',
                      'border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]'
                    )}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-80"
                      aria-hidden
                      style={{
                        background: `radial-gradient(ellipse 80% 55% at 0% 0%, ${c}22, transparent 55%)`,
                      }}
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">#{r.id}</p>
                        <p className="mt-1 text-xs text-zinc-500">Piso {String(r.id)[0]}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold"
                        style={{
                          borderColor: `${c}33`,
                          background: `${c}12`,
                          color: c,
                        }}
                      >
                        {r.status === 'ocupado' ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        {statusLabel(r.status)}
                      </span>
                    </div>

                    {is105 && (
                      <div className="relative mt-3">
                        <div className="h-px w-full bg-white/5" />
                        <p className="mt-2 text-[11px] text-zinc-500">
                          {r.status === 'vacante'
                            ? 'Pendiente de check-in'
                            : 'Asignada por IA (WhatsApp)'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* WhatsApp (30%) */}
          <motion.section
            {...motionIn}
            className="w-full lg:w-[30%] rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl"
          >
            <p className="mb-4 text-sm font-semibold text-zinc-200">WhatsApp Check-in</p>
            <WhatsAppIPhone items={chat} isTyping={typing} />
          </motion.section>
        </div>
      </div>
    </div>
  );
}

