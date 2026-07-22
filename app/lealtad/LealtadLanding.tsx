'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, MessageCircle, Sparkles } from 'lucide-react';
import { GlowButton } from '@/components/landing/GlowButton';
import { ModernChatPreview, type ChatLine } from '@/components/landing/ModernChatPreview';
import { ParticleField } from '@/components/landing/ParticleField';
import { ScrollReveal, StaggerItem, StaggerReveal } from '@/components/landing/ScrollReveal';
import { revealTransition } from '@/components/landing/motion';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';

const CYAN = '#00D4FF';
const GOLD = '#FFD700';
const BG = '#0a0a0a';

const WA_BASIC = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan Básico de tarjeta de lealtad ($299). Quiero saber cómo arrancar.',
);
const WA_PRO = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan Pro de tarjeta de lealtad ($499). Quiero activarlo con mi logo.',
);
const WA_GENERAL = agentiaWhatsAppUrl(
  'Hola Agentia, vi la landing de lealtad y quiero una tarjeta digital para mi negocio. Aquí les mando mi logo:',
);

const HERO_CHAT: ChatLine[] = [
  { from: 'bot', text: 'Sofía Reyes — 11 días sin visitar. Tenía 6 de 8 cafés.' },
  {
    from: 'bot',
    text: 'Hola Sofía 👋 te extrañamos en Bruma Coffee. Tu café #7 va por cuenta de la casa esta semana ☕',
  },
  { from: 'user', text: '¡Qué bueno! Paso mañana temprano 🙌' },
];

type CardKind = 'stamps' | 'points' | 'cashback';

type ShowcaseCard = {
  id: string;
  brand: string;
  tagline: string;
  initials: string;
  logoBg: string;
  typeLabel: string;
  caption: string;
  captionSub: string;
  kind: CardKind;
  gradient: string;
  stampIcon: string;
  customerName: string;
  stamps?: { filled: number; total: number; label: string };
  points?: { value: number; goal: number };
  cashback?: { amount: string };
  cardCode: string;
};

const SHOWCASE: ShowcaseCard[] = [
  {
    id: 'cafe',
    brand: 'Bruma Coffee',
    tagline: 'Specialty · Mérida',
    initials: 'BR',
    logoBg: 'linear-gradient(135deg,#C4A484,#8B5E3C)',
    typeLabel: 'Tarjeta de sellos',
    caption: 'Cafeterías',
    captionSub: 'Cada sello es una taza',
    kind: 'stamps',
    gradient: 'linear-gradient(145deg,#4A2C1A 0%,#2A160E 55%,#1A0E08 100%)',
    stampIcon: '☕',
    customerName: 'Sofía Reyes',
    stamps: { filled: 6, total: 8, label: '6 de 8 cafés' },
    cardCode: 'BRU-8842',
  },
  {
    id: 'barber',
    brand: 'Navaja Norte',
    tagline: 'Barbería · Corte & barba',
    initials: 'NN',
    logoBg: 'linear-gradient(135deg,#7DD3FC,#38BDF8)',
    typeLabel: 'Tarjeta de sellos',
    caption: 'Barberías',
    captionSub: 'Cada sello es un corte',
    kind: 'stamps',
    gradient: 'linear-gradient(145deg,#1E293B 0%,#0F172A 55%,#020617 100%)',
    stampIcon: '✂️',
    customerName: 'Diego Cetz',
    stamps: { filled: 7, total: 10, label: '7 de 10 cortes' },
    cardCode: 'NAV-2201',
  },
  {
    id: 'tortilla',
    brand: 'Maíz & Fuego',
    tagline: 'Tortillería artesanal',
    initials: 'MF',
    logoBg: 'linear-gradient(135deg,#FBBF24,#D97706)',
    typeLabel: 'Tarjeta de sellos',
    caption: 'Tortillerías',
    captionSub: 'Cada sello es un kilo',
    kind: 'stamps',
    gradient: 'linear-gradient(145deg,#92400E 0%,#78350F 50%,#451A03 100%)',
    stampIcon: '🫓',
    customerName: 'Doña Carmen',
    stamps: { filled: 8, total: 10, label: '8 de 10 kilos' },
    cardCode: 'MAZ-5510',
  },
  {
    id: 'spa',
    brand: 'Loto Atelier',
    tagline: 'Spa & estética',
    initials: 'LA',
    logoBg: 'linear-gradient(135deg,#6EE7B7,#059669)',
    typeLabel: 'Tarjeta de puntos',
    caption: 'Spas / Estéticas',
    captionSub: 'Puntos por sesión',
    kind: 'points',
    gradient: 'linear-gradient(145deg,#064E3B 0%,#022C22 55%,#011611 100%)',
    stampIcon: '🌿',
    customerName: 'Paola Herrera',
    points: { value: 420, goal: 500 },
    cardCode: 'LOT-7733',
  },
];

const REWARDS = [
  {
    title: 'Sellos / Visitas',
    desc: '"Compra 9, la 10 es gratis." Perfecto para cafés, tortillerías, spas — cualquier negocio de recompra frecuente.',
  },
  {
    title: 'Puntos',
    desc: 'Acumula puntos por cada compra y canjéalos por productos o descuentos. Ideal para tickets variables — barberías, salones, boutiques.',
  },
  {
    title: 'Cashback',
    desc: 'Un % de cada compra regresa como saldo para la próxima visita. Se siente como un beneficio real, no como un descuento.',
  },
];

const PHASES = [
  {
    n: '01',
    title: 'Escanea el QR',
    desc: 'El cliente abre su tarjeta en el celular. El negocio escanea el QR para sumar la visita — o el cliente escanea el QR del mostrador.',
  },
  {
    n: '02',
    title: 'Acumula',
    desc: 'Cada visita suma un sello temático, un punto o cashback. La tarjeta se actualiza sola en su Wallet.',
  },
  {
    n: '03',
    title: 'Reactiva',
    desc: 'Si deja de venir, le llega un WhatsApp automático con una promo — antes de que se vaya con la competencia.',
  },
];

const INDUSTRIES = [
  {
    id: 'barber',
    label: 'Barberías',
    title: 'Barberías y peluquerías',
    desc: 'El ciclo de corte (3-5 semanas) es predecible — el sistema detecta cuando alguien se pasó de su ciclo y manda el recordatorio antes de que pruebe otro barbero.',
    metric: 'Sellos con tijeras · ideal con agendamiento',
    cardId: 'barber',
    chat: [
      { from: 'bot' as const, text: 'Diego — 32 días desde su último corte (ciclo normal: 28).' },
      {
        from: 'bot' as const,
        text: 'Hola Diego 👋 ya se cumplieron tus 4 semanas en Navaja Norte. Tu corte #10 va por la casa ✂️ ¿Agendamos sábado?',
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'cafe',
    label: 'Cafeterías',
    title: 'Cafeterías',
    desc: 'Alta frecuencia, ticket bajo — la meta es traerlos de vuelta antes de que se acostumbren a otro café en su rutina diaria.',
    metric: 'Sellos con tazas · plan Básico o Pro',
    cardId: 'cafe',
    chat: [
      { from: 'bot' as const, text: 'Sofía — 9 días sin café. 6 tazas acumuladas.' },
      {
        from: 'bot' as const,
        text: 'Hola Sofía 👋 tu café #7 va por cuenta de la casa en Bruma Coffee esta semana ☕',
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'tortilla',
    label: 'Tortillerías',
    title: 'Tortillerías',
    desc: 'Compra casi diaria — cada kilo es un sello. El cliente ve su progreso y vuelve por el kilo gratis sin que tengas que recordar nada.',
    metric: 'Sellos con kilos · recompra ultra frecuente',
    cardId: 'tortilla',
    chat: [
      { from: 'bot' as const, text: 'Doña Carmen — 3 días sin comprar. 8 de 10 kilos.' },
      {
        from: 'bot' as const,
        text: 'Hola Carmen 👋 te faltan 2 kilos para tu kilo gratis en Maíz & Fuego 🫓',
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'spa',
    label: 'Spas / Estéticas',
    title: 'Spas y estéticas',
    desc: 'Ticket alto, ciclo largo entre visitas — aquí el agendamiento es casi obligatorio porque perder una cita cuesta más que en cualquier otro giro.',
    metric: 'Puntos por sesión · bundle + agenda',
    cardId: 'spa',
    chat: [
      { from: 'bot' as const, text: 'Paola — 18 días desde su último masaje.' },
      {
        from: 'bot' as const,
        text: 'Hola Paola 👋 20% en tu próximo masaje en Loto Atelier si agendas esta semana 🌿',
      },
    ] satisfies ChatLine[],
  },
] as const;

function qrSrc(cardCode: string) {
  const payload = `https://agentia.software/lealtad?checkin=${encodeURIComponent(cardCode)}&demo=1`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=8&color=111111&bgcolor=ffffff&data=${encodeURIComponent(payload)}`;
}

function DigitalLoyaltyPass({
  card,
  animate = true,
  compact = false,
}: {
  card: ShowcaseCard;
  animate?: boolean;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;
  const stampSize = compact ? 'h-8 w-8 text-[15px]' : 'h-9 w-9 text-[16px]';

  return (
    <motion.div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.65)] ${
        compact ? 'min-h-[210px] p-4' : 'min-h-[248px] p-5'
      }`}
      style={{ background: card.gradient }}
      whileHover={shouldAnimate && !compact ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(255,255,255,.12) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(255,255,255,.08), transparent 45%)',
        }}
        aria-hidden
      />

      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-[family-name:var(--font-space)] text-sm font-bold text-[#0a0a0a] shadow-sm"
            style={{ background: card.logoBg }}
          >
            {card.initials}
          </div>
          <div>
            <div className="font-[family-name:var(--font-space)] text-[15px] font-semibold leading-tight">
              {card.brand}
            </div>
            <div className="mt-0.5 text-[10px] opacity-65">{card.tagline}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.08em] opacity-55">Cliente</div>
          <div className="font-[family-name:var(--font-space)] text-[12px] font-medium">
            {card.customerName}
          </div>
        </div>
      </div>

      <div className="relative z-[1] my-3 flex-1">
        {card.kind === 'stamps' && card.stamps ? (
          <>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
                {card.stamps.label}
              </span>
              <span className="text-[10px] opacity-50">{card.typeLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: card.stamps.total }).map((_, i) => {
                const on = i < card.stamps!.filled;
                return (
                  <motion.div
                    key={i}
                    className={`flex ${stampSize} items-center justify-center rounded-full ${
                      on
                        ? 'bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                        : 'border border-dashed border-white/35 bg-white/5 opacity-45'
                    }`}
                    initial={shouldAnimate ? { scale: 0.55, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.12 + i * 0.045, duration: 0.28 }}
                    title={on ? `Visita ${i + 1}` : 'Pendiente'}
                  >
                    <span className={on ? '' : 'grayscale'}>{card.stampIcon}</span>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : null}

        {card.kind === 'points' && card.points ? (
          <>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
              Tus puntos
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl" aria-hidden>
                {card.stampIcon}
              </span>
              <div className="font-[family-name:var(--font-space)] text-[32px] font-bold leading-none">
                {card.points.value}
                <span className="ml-1 font-[family-name:var(--font-jakarta)] text-[13px] font-medium opacity-70">
                  / {card.points.goal} pts
                </span>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-white/90"
                initial={shouldAnimate ? { width: 0 } : false}
                animate={{
                  width: `${Math.min(100, (card.points.value / card.points.goal) * 100)}%`,
                }}
                transition={{ delay: 0.35, duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </>
        ) : null}

        {card.kind === 'cashback' && card.cashback ? (
          <>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
              Cashback disponible
            </div>
            <div className="font-[family-name:var(--font-space)] text-[28px] font-bold leading-none">
              {card.cashback.amount}{' '}
              <span className="font-[family-name:var(--font-jakarta)] text-[13px] font-medium opacity-70">
                MXN
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="relative z-[1] mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-3">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.1em] opacity-50">Escanea para sumar</div>
          <div className="mt-0.5 truncate font-mono text-[10px] opacity-70">{card.cardCode}</div>
          <div className="mt-1 text-[9px] leading-snug opacity-45">
            Personal del negocio o cliente en mostrador
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc(card.cardCode)}
            alt={`QR de check-in ${card.brand}`}
            width={56}
            height={56}
            className="h-14 w-14"
            loading="lazy"
          />
        </div>
      </div>
    </motion.div>
  );
}

function PhoneMockup({
  card,
  caption,
  showWalletChrome = true,
}: {
  card: ShowcaseCard;
  caption?: string;
  showWalletChrome?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[300px]"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={revealTransition(0.12, 0.55)}
    >
      <div
        className="pointer-events-none absolute -inset-10 rounded-[3rem] opacity-70 blur-3xl"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${CYAN}40, transparent 55%), radial-gradient(circle at 80% 80%, ${GOLD}28, transparent 50%)`,
        }}
        aria-hidden
      />

      <div className="relative rounded-[2.1rem] border border-white/20 bg-[#111] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]">
        <div className="overflow-hidden rounded-[1.65rem] bg-[#0a0a0a]">
          <div className="relative flex items-center justify-between bg-[#0a0a0a] px-5 pb-1 pt-3 text-[10px] font-semibold text-white/80">
            <span>9:41</span>
            <div className="absolute left-1/2 top-2 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1 opacity-80">
              <span className="inline-block h-2 w-3 rounded-[2px] border border-white/70" />
            </span>
          </div>

          {showWalletChrome ? (
            <div className="px-4 pb-2 pt-3">
              <p className="font-[family-name:var(--font-space)] text-[11px] font-medium tracking-wide text-white/45">
                Google Wallet
              </p>
              <p className="font-[family-name:var(--font-space)] text-lg font-bold text-white">
                Pases
              </p>
            </div>
          ) : null}

          <div className="px-3 pb-4">
            <DigitalLoyaltyPass card={card} compact />
            <p className="mt-3 text-center text-[10px] text-white/40">
              Apple Wallet · <span className="text-white/30">próximamente</span>
            </p>
          </div>
        </div>
      </div>

      {caption ? (
        <p className="mt-4 text-center text-[12px] text-white/50">{caption}</p>
      ) : null}
    </motion.div>
  );
}

function ConvertChat() {
  const [giro, setGiro] = useState<string | null>(null);
  const options = ['Cafetería', 'Barbería', 'Tortillería', 'Spa / estética', 'Otro'];

  const wa = agentiaWhatsAppUrl(
    `Hola Agentia, vi /lealtad. Tengo un negocio de ${giro || 'mi giro'} y quiero tarjeta de lealtad digital. Aquí les mando mi logo:`,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b141a]">
      <div className="flex items-center gap-3 border-b border-white/8 bg-[#111b21] px-4 py-3.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-[#0a0a0a]"
          style={{ background: CYAN }}
        >
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Agentia · Lealtad</p>
          <p className="text-[11px] text-[#25D366]">en línea · responde en minutos</p>
        </div>
      </div>

      <div className="flex min-h-[280px] flex-col gap-3 p-4">
        <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md bg-[#1f2c34] px-3.5 py-2.5 text-sm text-white/90">
          ¿Qué tipo de negocio quieres fidelizar? Te armamos la tarjeta con tu logo y sellos
          temáticos en 24h.
        </div>

        <div className="flex flex-wrap gap-2 self-start">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setGiro(o)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-[transform,border-color,background-color] duration-150 active:scale-[0.97] ${
                giro === o
                  ? 'border-[#00D4FF] bg-[#00D4FF]/15 text-[#00D4FF]'
                  : 'border-white/15 bg-white/5 text-white/75 hover:border-[#00D4FF]/40 hover:text-white'
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {giro ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[85%] self-end rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm text-[#0a0a0a]"
              style={{ background: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
            >
              {giro}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[92%] space-y-3 self-start"
            >
              <div className="rounded-2xl rounded-bl-md bg-[#1f2c34] px-3.5 py-2.5 text-sm text-white/90">
                Perfecto para {giro.toLowerCase()}. QR para sumar visitas, sellos con la identidad de
                tu marca y WhatsApp automático. Planes desde $299/mes.
              </div>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-[#06130B] shadow-[0_0_28px_rgba(37,211,102,0.35)] transition-[transform,box-shadow] duration-160 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" />
                Continuar en WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CheckinToast() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkin = params.get('checkin');
    if (!checkin) return;
    setCode(checkin);
    const t = window.setTimeout(() => setCode(null), 5200);
    return () => window.clearTimeout(t);
  }, []);

  if (!code) return null;

  return (
    <div className="fixed left-1/2 top-5 z-[70] w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-[#25D366]/40 bg-[#0b141a] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
      <p className="font-[family-name:var(--font-space)] text-[11px] uppercase tracking-wider text-[#25D366]">
        Check-in demo
      </p>
      <p className="mt-1 text-sm text-white/90">
        QR leído: <span className="font-mono text-[#00D4FF]">{code}</span> — así suma una visita en
        producción.
      </p>
    </div>
  );
}

export function LealtadLanding() {
  const reduceMotion = useReducedMotion();
  const [industry, setIndustry] = useState<(typeof INDUSTRIES)[number]>(INDUSTRIES[1]);
  const industryCard = SHOWCASE.find((c) => c.id === industry.cardId) ?? SHOWCASE[0];

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-jakarta)] text-white"
      style={{ background: BG }}
    >
      <CheckinToast />
      <ParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 15% -5%, rgba(0,212,255,0.14), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 10%, rgba(255,215,0,0.09), transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <header className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-agentia-2026.png"
              alt="Agentia"
              width={44}
              height={44}
              className="rounded-lg"
              priority
            />
            <span className="font-[family-name:var(--font-space)] text-lg font-bold">
              Agentia
              <span className="ml-1.5 text-[#00D4FF]">Lealtad</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <a href="#acumular" className="transition-colors hover:text-[#00D4FF]">
              Cómo acumulan
            </a>
            <a href="#giros" className="transition-colors hover:text-[#00D4FF]">
              Tu giro
            </a>
            <a href="#precios" className="transition-colors hover:text-[#00D4FF]">
              Planes
            </a>
          </nav>
          <GlowButton href={WA_GENERAL} external>
            Hablar por WhatsApp
          </GlowButton>
        </header>

        <section className="grid items-center gap-10 py-12 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-2 lg:gap-8 lg:py-8">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0, 0.35)}
              className="mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Partner oficial Meta · WhatsApp Business API
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.06, 0.45)}
              className="font-[family-name:var(--font-space)] text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]"
            >
              La tarjeta de sellos de siempre —{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                ahora en el celular.
              </span>
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.12, 0.4)}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
            >
              Tus clientes la ven en su Wallet. Tú (o ellos) escanean el QR para sumar la visita. Y
              cuando dejan de venir, les llega un WhatsApp solo.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.18, 0.35)}
              className="mt-8 flex flex-wrap gap-3"
            >
              <GlowButton href="#precios">Ver planes desde $299</GlowButton>
              <GlowButton href="#escribir" variant="secondary">
                Quiero mi tarjeta
              </GlowButton>
            </motion.div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={revealTransition(0.28, 0.4)}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45 sm:text-sm"
            >
              <span>
                <strong className="text-white">QR real</strong> para check-in
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>
                <strong className="text-[#FFD700]">Sellos</strong> con la identidad del giro
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>0 apps que instalar</span>
            </motion.div>
          </div>
          <PhoneMockup
            card={SHOWCASE[0]}
            caption="Así la ve tu cliente en el celular — no es una tarjeta de plástico."
          />
        </section>

        <section className="pb-6 pt-2">
          <ScrollReveal>
            <p className="mb-2 text-center font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Ejemplos por giro
            </p>
            <h2 className="mb-8 text-center font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              Cada negocio con sus sellos — y un QR que sí se escanea
            </h2>
          </ScrollReveal>
          <StaggerReveal className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((card) => (
              <StaggerItem key={card.id}>
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[240px]">
                    <div className="rounded-[1.5rem] border border-white/15 bg-[#111] p-2 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.8)]">
                      <div className="overflow-hidden rounded-[1.15rem] bg-[#0a0a0a] px-2 pb-3 pt-2">
                        <div className="mb-2 flex justify-center">
                          <div className="h-1.5 w-16 rounded-full bg-white/15" />
                        </div>
                        <DigitalLoyaltyPass card={card} compact />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <b className="block font-[family-name:var(--font-space)] text-sm text-white">
                      {card.caption}
                    </b>
                    <span className="text-[13px] text-white/45">{card.captionSub}</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        <section id="acumular" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Cómo acumulan tus clientes
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Tú eliges el modelo que más le quede a tu negocio
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Mismo sistema por dentro — la experiencia se adapta al tipo de negocio, no al revés.
            </p>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
            {REWARDS.map((r) => (
              <StaggerItem key={r.title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/35">
                  <h3 className="font-[family-name:var(--font-space)] text-xl font-bold">{r.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{r.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        <section id="como" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Cómo funciona
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Tres pasos. Cero trabajo manual.
            </h2>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
            {PHASES.map((p) => (
              <StaggerItem key={p.n}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/35">
                  <span className="font-[family-name:var(--font-space)] text-sm text-[#00D4FF]">
                    {p.n}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-space)] text-xl font-bold">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        <section className="grid items-center gap-10 py-12 lg:grid-cols-2">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              Así se ve la reactivación
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              El sistema detecta. WhatsApp recupera.
            </h2>
            <p className="mt-3 max-w-md text-white/55">
              No dependes de notificaciones del wallet que nadie abre. Llegas por el canal donde ya te
              contestan.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <ModernChatPreview
              businessName="Bruma Coffee"
              accent="#25D366"
              messages={HERO_CHAT}
              compact
            />
          </ScrollReveal>
        </section>

        <section id="giros" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Casos por industria
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              El mensaje correcto para cada tipo de negocio
            </h2>
          </ScrollReveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setIndustry(ind)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-150 active:scale-[0.97] ${
                  industry.id === ind.id
                    ? 'border-[#00D4FF] bg-[#00D4FF]/12 text-[#00D4FF]'
                    : 'border-white/12 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <ScrollReveal key={`${industry.id}-phone`}>
              <PhoneMockup card={industryCard} showWalletChrome={false} />
            </ScrollReveal>
            <ScrollReveal key={industry.id} delay={0.06}>
              <h3 className="font-[family-name:var(--font-space)] text-2xl font-bold">
                {industry.title}
              </h3>
              <p className="mt-3 text-white/55">{industry.desc}</p>
              <p className="mt-3 font-mono text-xs text-[#00D4FF]">{industry.metric}</p>
              <div className="mt-5">
                <ModernChatPreview
                  businessName={industry.label}
                  accent={CYAN}
                  messages={[...industry.chat]}
                  compact
                />
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-12">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              El panel del negocio
            </p>
            <h2 className="mb-8 font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              Y tú ves quién está a punto de dejar de venir
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-3">
                <span className="font-mono text-[11px] text-white/40">
                  panel.agentia.software · lealtad · simulación
                </span>
                <span className="text-[11px] text-[#00D4FF]">Activos · En riesgo · Perdidos</span>
              </div>
              <div className="grid gap-px bg-white/10 md:grid-cols-3">
                {[
                  {
                    title: 'Activos',
                    color: '#25D366',
                    count: '284',
                    rows: [
                      ['Sofía Reyes', 'hoy · 22 visitas'],
                      ['Diego Cetz', 'hoy · 31 visitas'],
                    ],
                  },
                  {
                    title: 'En riesgo',
                    color: GOLD,
                    count: '68',
                    rows: [
                      ['Doña Carmen', '3 días · 48 kilos'],
                      ['Paola Herrera', '18 días · 14 visitas'],
                    ],
                  },
                  {
                    title: 'Perdidos',
                    color: '#FF6B5E',
                    count: '31',
                    rows: [
                      ['Renata Solís', '41 días · 5 visitas'],
                      ['Iván Novelo', '53 días · 3 visitas'],
                    ],
                  },
                ].map((col) => (
                  <div key={col.title} className="bg-[#0a0a0a] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <i
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: col.color }}
                        />
                        {col.title}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/45">
                        {col.count}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {col.rows.map(([name, meta]) => (
                        <div
                          key={name}
                          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                        >
                          <p className="text-sm font-semibold">{name}</p>
                          <p className="font-mono text-[11px] text-white/40">{meta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section id="precios" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Planes
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Dos planes. Sin letras chiquitas.
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Menos que otras tarjetas digitales — y llegas por WhatsApp, no por notificaciones que
              nadie lee.
            </p>
          </ScrollReveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ScrollReveal>
              <div className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <p className="font-mono text-xs uppercase tracking-wider text-white/45">Básico</p>
                <p className="mt-2 font-[family-name:var(--font-space)] text-4xl font-bold">
                  $299
                  <span className="ml-1 text-sm font-medium text-white/45">MXN/mes</span>
                </p>
                <p className="mt-1 text-sm text-white/45">Ideal para un solo local</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-white/75">
                  {[
                    'Tarjetas ilimitadas · 1 sucursal',
                    'QR de check-in (cliente o personal)',
                    'Sellos temáticos, puntos o cashback',
                    'Google Wallet + acceso PWA',
                    'WhatsApp automático por inactividad',
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[11px] text-white/35">Apple Wallet · próximamente</p>
                <a
                  href={WA_BASIC}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3.5 text-sm font-bold transition-[transform,border-color] duration-160 hover:-translate-y-px hover:border-[#00D4FF]/50 active:scale-[0.97]"
                >
                  Quiero el Básico
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <div className="relative flex h-full flex-col rounded-2xl border border-[#00D4FF]/40 bg-white/[0.05] p-7 shadow-[0_0_40px_rgba(0,212,255,0.12)]">
                <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#FFD700] px-3 py-1 text-[11px] font-bold text-[#0a0a0a]">
                  Más elegido
                </span>
                <p className="font-mono text-xs uppercase tracking-wider text-white/45">Pro</p>
                <p className="mt-2 font-[family-name:var(--font-space)] text-4xl font-bold">
                  $499
                  <span className="ml-1 text-sm font-medium text-white/45">MXN/mes</span>
                </p>
                <p className="mt-1 text-sm text-white/45">Para negocios que quieren crecer más rápido</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-white/75">
                  {[
                    'Todo lo del plan Básico',
                    'Hasta 3 sucursales',
                    'Mensajes de cumpleaños automáticos',
                    'Panel de clientes por segmento',
                    'Exportar base de datos de clientes',
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[11px] text-white/35">Apple Wallet · próximamente</p>
                <a
                  href={WA_PRO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a] shadow-[0_0_32px_rgba(0,212,255,0.35)] transition-[transform,box-shadow] duration-160 hover:-translate-y-px hover:shadow-[0_0_48px_rgba(0,212,255,0.5)] active:scale-[0.97]"
                  style={{ background: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
                >
                  Quiero el Pro
                </a>
              </div>
            </ScrollReveal>
          </div>
          <p className="mt-6 text-center text-sm text-white/45">
            Otras plataformas empiezan en{' '}
            <span className="font-mono text-white/70">$399–$700 MXN/mes</span>. Nosotros llegamos por
            WhatsApp, no solo por notificaciones del wallet.
          </p>
        </section>

        <section id="escribir" className="py-16 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <ScrollReveal>
              <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
                Empieza hoy
              </p>
              <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
                Mándanos tu logo por WhatsApp y en 24 horas tienes tu tarjeta activa.
              </h2>
              <p className="mt-4 text-white/55">
                Sin contratos largos, sin instalación técnica de tu parte — nosotros conectamos todo.
                Sellos con la identidad de tu giro y QR listo para sumar visitas.
              </p>
              <a
                href={WA_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] transition-colors hover:text-[#FFD700]"
              >
                O escríbenos directo
                <ArrowRight className="h-4 w-4" />
              </a>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <ConvertChat />
            </ScrollReveal>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
          <Link href="/" className="text-white/60 transition-colors hover:text-[#00D4FF]">
            agentia.software
          </Link>
          {' · '}
          Lealtad · Partner oficial Meta
        </footer>
      </div>

      <a
        href={WA_GENERAL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#06130B] shadow-[0_8px_32px_rgba(37,211,102,0.45)] transition-[transform,box-shadow] duration-160 hover:scale-105 hover:shadow-[0_12px_40px_rgba(37,211,102,0.55)] active:scale-95"
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </main>
  );
}
