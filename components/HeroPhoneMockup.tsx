'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Camera, Leaf, Scissors, Send, Shield, Sparkles, UtensilsCrossed, Waves } from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

// ─── Types ─────────────────────────────────────────────────────────────────────
type LoyaltyInfo = {
  name: string;
  filled: number;
  total: number;
  reward: string;
  code?: string;
  accent: string;
};

type Appt = { time: string; name: string; service: string; unconfirmed?: boolean };

type BotItem = {
  kind: 'bot';
  text: string;
  chips?: string[];
  loyalty?: LoyaltyInfo;
  appointments?: Appt[];
  isStatus?: boolean;
};
type UserItem  = { kind: 'user';  text: string };
type ImageItem = { kind: 'image' };
type DemoItem  = BotItem | UserItem | ImageItem;

interface Demo {
  id: string;
  Icon: LucideIcon;
  name: string;
  accent: string;
  items: DemoItem[];
  delays: number[]; // ms from demo start when each item appears
}

// ─── Demo scripts ──────────────────────────────────────────────────────────────
// Timing rules:
//  Bot typing auto-shows 1200ms before its reveal delay.
//  User: 2000ms after preceding bot.
//  Next bot: 1500ms after user + 1200ms typing = 2700ms after user.
const DEMOS: Demo[] = [
  {
    id: 'barber',
    Icon: Scissors,
    name: 'Barbería',
    accent: '#22c55e',
    items: [
      {
        kind: 'bot',
        text: 'Hola Carlos 👋 La última vez te hicimos\nCorte + Barba con Fernando. ¿Repetimos?',
        chips: ['✅ Sí, lo mismo', '📋 Ver opciones'],
      },
      { kind: 'user', text: 'Sí, lo mismo' },
      {
        kind: 'bot',
        text: 'Listo ✅ Fernando te espera mañana\n11:00 AM. Recordatorio 1h antes 🔔',
        loyalty: { name: 'Carlos', filled: 4, total: 5, reward: 'corte gratis', code: 'CB-0042', accent: '#22c55e' },
      },
    ],
    delays: [1200, 3200, 5900],
  },
  {
    id: 'restaurante',
    Icon: UtensilsCrossed,
    name: 'Restaurante',
    accent: '#ef4444',
    items: [
      { kind: 'bot', text: '¡Bienvenido! 🍽️ ¿Para cuántos y a qué hora?' },
      { kind: 'user', text: 'Somos 4, a las 9pm' },
      { kind: 'bot', text: 'Mesa para 4 confirmada — 9:00 PM 🎉\n¿Vemos el menú especial de hoy?' },
      { kind: 'user', text: 'Sí' },
      { kind: 'bot', text: '🥩 Filete al carbón — $285\n🍤 Camarones al ajillo — $245\n🥗 César especial — $145' },
    ],
    delays: [1200, 3200, 5900, 7900, 10600],
  },
  {
    id: 'nail',
    Icon: Sparkles,
    name: 'Nail Studio',
    accent: '#ec4899',
    items: [
      { kind: 'bot', text: 'Hola Ana 💅 Tu última visita:\nUñas acrílicas con Sofía.\n¿Repetimos o algo nuevo?' },
      { kind: 'user', text: 'Algo diferente 🎨' },
      { kind: 'bot', text: 'Te recomiendo Nail Art +$50\nsobre cualquier servicio.\nSofía tiene el viernes 3pm ✨' },
      { kind: 'user', text: 'Perfecto 🙌' },
      {
        kind: 'bot',
        text: '¡Agendado! Viernes 3pm con Sofía 💅',
        loyalty: { name: 'Ana', filled: 3, total: 5, reward: 'manicure gratis', accent: '#ec4899' },
      },
    ],
    delays: [1200, 3200, 5900, 7900, 10600],
  },
  {
    id: 'nutricion',
    Icon: Leaf,
    name: 'Nutrición',
    accent: '#16a34a',
    items: [
      { kind: 'bot', text: 'Hola 😊 ¿Qué desayunaste hoy?\nEscríbelo o manda una foto 📷' },
      { kind: 'image' },
      { kind: 'bot', text: '🔍 Analizando tu desayuno con IA...' },
      {
        kind: 'bot',
        text: '• Huevos revueltos: ~180 kcal\n• Tortillas x2: ~160 kcal\n• Frijoles: ~120 kcal\nTotal: ~460 kcal\n📊 460/1,800 ▓▓░░░░░░ 26%',
      },
    ],
    delays: [1200, 3200, 5900, 8600],
  },
  {
    id: 'spa',
    Icon: Waves,
    name: 'Spa',
    accent: '#0ea5e9',
    items: [
      { kind: 'bot', text: 'Hola Valeria 🌸 Tienes 420 puntos.\n¡Solo $80 más para tto. gratis!' },
      { kind: 'user', text: '¿Qué tienen esta semana?' },
      {
        kind: 'bot',
        text: '💆 Masaje 60min — $650\n🧖 Facial hidratante — $450\n✨ Aromaterapia — $380 ← cubre saldo 🎁',
      },
      { kind: 'user', text: 'El de aromaterapia' },
      { kind: 'bot', text: '¡Canjeado! 🎉 Cita el jueves 5pm.\nSaldo restante: $40 ✨' },
    ],
    delays: [1200, 3200, 5900, 7900, 10600],
  },
  {
    id: 'dentista',
    Icon: Shield,
    name: 'Dentista',
    accent: '#3b82f6',
    items: [
      {
        kind: 'bot',
        text: 'Dr. Martínez, mañana tienes 3 pacientes.\nSandra López (10am) no ha confirmado ⚠️',
        appointments: [
          { time: '9:00',  name: 'Luis García',  service: 'Limpieza' },
          { time: '10:00', name: 'Sandra López', service: 'Limpieza', unconfirmed: true },
          { time: '11:30', name: 'Pedro Ruiz',   service: 'Revisión' },
        ],
      },
      { kind: 'user', text: 'Manda recordatorio a Sandra' },
      { kind: 'bot', text: '✅ Enviado a Sandra:\n"Mañana 10:00 AM limpieza dental.\nConfirma respondiendo SI ✓"' },
      { kind: 'bot', text: '✓ Sandra confirmó — hace 2 min', isStatus: true },
    ],
    delays: [1200, 3200, 5900, 10500],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{ background: '#202c33', borderRadius: '1rem 1rem 1rem 0.25rem' }}
      >
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${d * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function LoyaltyMini({ name, filled, total, reward, code, accent }: LoyaltyInfo) {
  return (
    <div
      className="mt-1.5 rounded-xl p-2.5"
      style={{ background: '#0f1c23', border: `1px solid ${accent}40` }}
    >
      <p className="text-white text-[10px] font-semibold mb-1.5">{name}</p>
      <div className="flex gap-1 mb-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{
              background: i < filled ? accent : '#1e293b',
              border: `1px solid ${i < filled ? accent : 'rgba(255,255,255,0.12)'}`,
            }}
          />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: accent }}>
        Próximo: {reward}
      </p>
      {code && (
        <p className="text-[10px] text-slate-500 mt-0.5">Código: {code}</p>
      )}
    </div>
  );
}

function ApptList({ items }: { items: Appt[] }) {
  return (
    <div
      className="mt-1.5 rounded-xl overflow-hidden text-[10px]"
      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {items.map((a, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2.5 py-1.5"
          style={{
            borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            background: a.unconfirmed ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
          }}
        >
          <span className="text-green-400 font-mono font-bold w-8 flex-shrink-0">{a.time}</span>
          <span className="text-white flex-1 truncate">{a.name}</span>
          {a.unconfirmed && <span className="text-red-400 flex-shrink-0">⚠</span>}
        </div>
      ))}
    </div>
  );
}

function ChatItemView({ item, accent }: { item: DemoItem; accent: string }) {
  if (item.kind === 'image') {
    return (
      <div className="flex justify-end">
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: '#374151', borderRadius: '1rem 1rem 0.25rem 1rem' }}
        >
          <Camera className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-400">Foto enviada</span>
        </div>
      </div>
    );
  }

  if (item.kind === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[88%] rounded-2xl px-3 py-2 text-[11px] text-white leading-relaxed"
          style={{ background: accent, borderRadius: '1rem 1rem 0.25rem 1rem' }}
        >
          {item.text}
        </div>
      </div>
    );
  }

  // bot
  return (
    <div className="flex flex-col items-start max-w-[92%]">
      {item.isStatus ? (
        <p className="text-[10px] px-2" style={{ color: accent }}>
          {item.text}
        </p>
      ) : (
        <div
          className="rounded-2xl px-3 py-2 text-[11px] text-slate-100 leading-relaxed whitespace-pre-line"
          style={{ background: '#202c33', borderRadius: '1rem 1rem 1rem 0.25rem' }}
        >
          {item.text}
        </div>
      )}
      {item.chips && (
        <div className="mt-1.5 w-full space-y-1">
          {item.chips.map((c) => (
            <div
              key={c}
              className="rounded-lg px-2.5 py-1.5 text-[10px] text-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}50`, color: accent }}
            >
              {c}
            </div>
          ))}
        </div>
      )}
      {item.appointments && <ApptList items={item.appointments} />}
      {item.loyalty && <LoyaltyMini {...item.loyalty} />}
    </div>
  );
}

function MatrixParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        char: '01アカサタナハマヤラ01'.charAt(i % 13),
        left: `${((i / 18) * 100 + (i % 3) * 2.5).toFixed(1)}%`,
        delay: `${(i * 0.07).toFixed(2)}s`,
        duration: `${(0.7 + (i % 5) * 0.12).toFixed(2)}s`,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-24px',
            color: '#22c55e',
            opacity: 0.55,
            fontSize: '10px',
            fontFamily: 'monospace',
            animation: `matrixFall ${p.duration} ${p.delay} linear both`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function HeroPhoneMockup() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const demo = DEMOS[demoIdx];

    setVisibleCount(0);
    setTyping(true); // initial typing before first bot msg
    setTransitioning(false);
    setShowLabel(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const T = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    demo.items.forEach((item, i) => {
      const revealAt = demo.delays[i];

      if (item.kind === 'bot') {
        T(() => { setTyping(false); setVisibleCount(i + 1); }, revealAt);
        // Pre-show typing before the next bot message
        const nextBotIdx = demo.items.findIndex((m, j) => j > i && m.kind === 'bot');
        if (nextBotIdx !== -1) {
          const typingAt = demo.delays[nextBotIdx] - 1200;
          if (typingAt > revealAt) T(() => setTyping(true), typingAt);
        }
      } else {
        T(() => setVisibleCount(i + 1), revealAt);
      }
    });

    // Transition at 14 s
    T(() => setTransitioning(true), 14000);
    T(() => setShowLabel(true), 14700);
    T(() => {
      setShowLabel(false);
      setDemoIdx((prev) => (prev + 1) % DEMOS.length);
    }, 16100);

    return () => timers.forEach(clearTimeout);
  }, [demoIdx]);

  const demo = DEMOS[demoIdx];
  const nextDemo = DEMOS[(demoIdx + 1) % DEMOS.length];

  return (
    <div
      className="w-[240px] md:w-[260px] flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: '#000',
        border: '1px solid rgba(34,197,94,0.3)',
        boxShadow: '0 0 50px rgba(34,197,94,0.14), 0 20px 60px rgba(0,0,0,0.65)',
        height: '480px',
      }}
    >
      {/* ── Phone header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.92)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: '#111', border: `1.5px solid ${demo.accent}` }}
        >
          <demo.Icon className="w-4 h-4" style={{ color: demo.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-[13px] font-semibold leading-tight truncate">{demo.name}</p>
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: demo.accent }}
            />
            <span className="text-[10px]" style={{ color: demo.accent }}>en línea</span>
          </div>
        </div>
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden"
          style={{ border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <Image src="/logo-agentia-2026.png" alt="Agentia" width={24} height={24} className="object-contain" />
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!transitioning ? (
            <motion.div
              key={`chat-${demoIdx}`}
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -32, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0"
              style={{
                background: '#0b141a',
                display: 'flex',
                flexDirection: 'column-reverse',
                overflow: 'hidden',
                padding: '12px',
                gap: '8px',
              }}
            >
              {/* column-reverse: first child = bottom of visual layout */}
              {typing && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
              {[...demo.items.slice(0, visibleCount)].reverse().map((item, revIdx) => {
                const stableKey = visibleCount - 1 - revIdx;
                return (
                  <motion.div
                    key={stableKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChatItemView item={item} accent={demo.accent} />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: '#000' }}
            >
              <MatrixParticles />
              <AnimatePresence>
                {showLabel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10 flex flex-col items-center gap-2"
                  >
                    <nextDemo.Icon
                      className="w-8 h-8"
                      style={{ color: nextDemo.accent, filter: `drop-shadow(0 0 8px ${nextDemo.accent})` }}
                    />
                    <span
                      className="text-xl font-bold"
                      style={{ color: nextDemo.accent, textShadow: `0 0 20px ${nextDemo.accent}88` }}
                    >
                      {nextDemo.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ background: '#0b141a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex-1 rounded-full px-3 py-1.5 text-[10px] text-slate-600"
          style={{ background: '#1e293b' }}
        >
          Escribe un mensaje…
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: demo.accent }}
        >
          <Send className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}
