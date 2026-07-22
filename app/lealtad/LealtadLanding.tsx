'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
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
  { from: 'bot', text: 'Marisol Peña — 14 días sin visitar. Tenía 6 de 8 sellos.' },
  {
    from: 'bot',
    text: 'Hola Marisol 👋 te extrañamos en Café Alcalá. Tu sello #6 va por cuenta de la casa esta semana ☕',
  },
  { from: 'user', text: '¡Qué bueno! Paso mañana en la mañana 🙌' },
];

type CardKind = 'stamps' | 'points' | 'cashback';

type ShowcaseCard = {
  id: string;
  brand: string;
  initials: string;
  typeLabel: string;
  caption: string;
  captionSub: string;
  kind: CardKind;
  gradient: string;
  stamps?: { filled: number; total: number; label: string };
  points?: { value: number; goal: number };
  cashback?: { amount: string };
  serial: string;
};

const SHOWCASE: ShowcaseCard[] = [
  {
    id: 'cafe',
    brand: 'Café Alcalá',
    initials: 'CA',
    typeLabel: 'Tarjeta de sellos',
    caption: 'Cafeterías',
    captionSub: 'Sellos por visita',
    kind: 'stamps',
    gradient: 'linear-gradient(135deg,#6B4226,#3B2213)',
    stamps: { filled: 6, total: 8, label: '6 de 8 sellos' },
    serial: 'N° 4471 2839',
  },
  {
    id: 'barber',
    brand: "Diego's Barber",
    initials: 'DC',
    typeLabel: 'Tarjeta de puntos',
    caption: 'Peluquerías / Barberías',
    captionSub: 'Puntos acumulables',
    kind: 'points',
    gradient: 'linear-gradient(135deg,#232B36,#0E1216)',
    points: { value: 240, goal: 300 },
    serial: 'N° 8802 1156',
  },
  {
    id: 'resto',
    brand: 'Casa Nola',
    initials: 'CN',
    typeLabel: 'Tarjeta cashback',
    caption: 'Restaurantes',
    captionSub: '% de regreso en cada visita',
    kind: 'cashback',
    gradient: 'linear-gradient(135deg,#611F30,#310F19)',
    cashback: { amount: '$184' },
    serial: 'N° 3390 7724',
  },
  {
    id: 'spa',
    brand: 'Spa Zöe',
    initials: 'SP',
    typeLabel: 'Tarjeta de sellos',
    caption: 'Spas / Estéticas',
    captionSub: 'Sesiones acumulables',
    kind: 'stamps',
    gradient: 'linear-gradient(135deg,#2E4A42,#152520)',
    stamps: { filled: 3, total: 5, label: '3 de 5 sesiones' },
    serial: 'N° 5567 4402',
  },
];

const REWARDS = [
  {
    title: 'Sellos / Visitas',
    desc: '"Compra 9, la 10 es gratis." Perfecto para cafés, restaurantes, spas — cualquier negocio de recompra frecuente.',
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
    title: 'Escanea y guarda',
    desc: 'El cliente escanea el QR de tu negocio y su tarjeta queda en Google Wallet — sin apps, en segundos.',
  },
  {
    n: '02',
    title: 'Acumula',
    desc: 'Cada visita suma un sello, un punto o cashback. La tarjeta se actualiza sola en su celular.',
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
    label: 'Peluquerías / Barberías',
    title: 'Peluquerías y barberías',
    desc: 'El ciclo de corte (3-5 semanas) es predecible — el sistema detecta cuando alguien se pasó de su ciclo normal y manda el recordatorio antes de que se vaya con otro barbero.',
    metric: 'Se vende mejor con: bundle + agendamiento',
    cardId: 'barber',
    chat: [
      { from: 'bot' as const, text: 'Diego — 32 días desde su último corte (ciclo normal: 28).' },
      {
        from: 'bot' as const,
        text: "Hola Diego 👋 ya se cumplieron tus 4 semanas. Tu corte #10 va por la casa ✂️ ¿Agendamos sábado?",
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'cafe',
    label: 'Cafeterías',
    title: 'Cafeterías',
    desc: 'Alta frecuencia, ticket bajo — la meta es traerlos de vuelta antes de que se acostumbren a otro café en su rutina diaria.',
    metric: 'Se vende mejor con: plan Básico o Pro, sin agendamiento',
    cardId: 'cafe',
    chat: [
      { from: 'bot' as const, text: 'Marisol — 9 días sin café. 6 sellos acumulados.' },
      {
        from: 'bot' as const,
        text: 'Hola Marisol 👋 tu café #6 va por cuenta de la casa esta semana ☕',
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'resto',
    label: 'Restaurantes',
    title: 'Restaurantes',
    desc: 'Visitas más espaciadas — el gancho suele ser un platillo o postre gratis, no un descuento en efectivo, para proteger el ticket promedio.',
    metric: 'Se vende mejor con: plan Pro, ideal con reseñas de Google activadas',
    cardId: 'resto',
    chat: [
      { from: 'bot' as const, text: 'Jorge — 21 días sin visitar Casa Nola.' },
      {
        from: 'bot' as const,
        text: 'Hola Jorge 👋 vuelve por tu postre de la casa gratis en tu próxima visita 🍰',
      },
    ] satisfies ChatLine[],
  },
  {
    id: 'spa',
    label: 'Spas / Estéticas',
    title: 'Spas y estéticas',
    desc: 'Ticket alto, ciclo largo entre visitas — aquí el agendamiento es casi obligatorio porque perder una cita cuesta más que en cualquier otro giro.',
    metric: 'Se vende mejor con: bundle + agendamiento',
    cardId: 'spa',
    chat: [
      { from: 'bot' as const, text: 'Paola — 18 días desde su último masaje.' },
      {
        from: 'bot' as const,
        text: 'Hola Paola 👋 20% en tu próximo masaje si agendas esta semana 💆',
      },
    ] satisfies ChatLine[],
  },
] as const;

function MiniLoyaltyCard({
  card,
  animate = true,
}: {
  card: ShowcaseCard;
  animate?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  return (
    <motion.div
      className="relative flex min-h-[190px] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-[20px] px-[22px] py-5 text-white shadow-[0_24px_50px_-18px_rgba(0,0,0,0.55)]"
      style={{ background: card.gradient }}
      whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 35%)',
        }}
        aria-hidden
      />
      <div className="relative z-[1] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/15 font-[family-name:var(--font-space)] text-[13px] font-bold">
            {card.initials}
          </div>
          <div>
            <div className="font-[family-name:var(--font-space)] text-[14.5px] font-semibold">
              {card.brand}
            </div>
            <div className="mt-px text-[10.5px] opacity-70">{card.typeLabel}</div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] my-1.5">
        {card.kind === 'stamps' && card.stamps ? (
          <>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
              {card.stamps.label}
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {Array.from({ length: card.stamps.total }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] ${
                    i < card.stamps!.filled
                      ? 'border-transparent bg-white/92 text-[#222]'
                      : 'border-[1.5px] border-white/40'
                  }`}
                  initial={shouldAnimate ? { scale: 0.5, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.28 }}
                >
                  {i < card.stamps!.filled ? '✓' : ''}
                </motion.div>
              ))}
            </div>
          </>
        ) : null}

        {card.kind === 'points' && card.points ? (
          <>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
              Tus puntos
            </div>
            <div className="font-[family-name:var(--font-space)] text-[30px] font-bold leading-none">
              {card.points.value}{' '}
              <span className="font-[family-name:var(--font-jakarta)] text-[13px] font-medium opacity-75">
                / {card.points.goal} pts
              </span>
            </div>
          </>
        ) : null}

        {card.kind === 'cashback' && card.cashback ? (
          <>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.08em] opacity-65">
              Cashback disponible
            </div>
            <div className="font-[family-name:var(--font-space)] text-[26px] font-bold leading-none">
              {card.cashback.amount}{' '}
              <span className="font-[family-name:var(--font-jakarta)] text-[13px] font-medium opacity-70">
                MXN
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="relative z-[1]">
        <div
          className="mb-1.5 h-[26px] rounded opacity-90"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(255,255,255,.9) 0 2px, transparent 2px 5px)',
          }}
        />
        <div className="font-mono text-[9.5px] tracking-[0.05em] opacity-60">{card.serial}</div>
      </div>
    </motion.div>
  );
}

function HeroCard() {
  const reduceMotion = useReducedMotion();
  const cafe = SHOWCASE[0];

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[340px]"
      initial={reduceMotion ? false : { opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={revealTransition(0.15, 0.55)}
      style={{ perspective: 900 }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-70 blur-3xl"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${CYAN}44, transparent 55%), radial-gradient(circle at 80% 80%, ${GOLD}33, transparent 50%)`,
        }}
        aria-hidden
      />
      <MiniLoyaltyCard card={cafe} />
      <motion.div
        className="mt-4 overflow-hidden rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 px-3 py-2.5 text-[12px] leading-snug text-white/85"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <span className="mb-1 block font-[family-name:var(--font-space)] text-[10px] uppercase tracking-wider text-[#25D366]">
          WhatsApp automático
        </span>
        Tu sello #6 va por cuenta de la casa esta semana ☕
      </motion.div>
      <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-white/40">
        <span>Google Wallet</span>
        <span className="text-[10px] text-white/30">Apple · próximamente</span>
      </div>
    </motion.div>
  );
}

function ConvertChat() {
  const [giro, setGiro] = useState<string | null>(null);
  const options = ['Cafetería', 'Barbería', 'Restaurante', 'Spa / estética', 'Otro'];

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
          ¿Qué tipo de negocio quieres fidelizar? Te armamos la tarjeta con tu logo en 24h.
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
                Perfecto para {giro.toLowerCase()}. Sellos, puntos o cashback — tú eliges. Planes desde
                $299/mes. Mándame tu logo por WhatsApp.
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

export function LealtadLanding() {
  const reduceMotion = useReducedMotion();
  const [industry, setIndustry] = useState<(typeof INDUSTRIES)[number]>(INDUSTRIES[1]);
  const industryCard = SHOWCASE.find((c) => c.id === industry.cardId) ?? SHOWCASE[0];

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-jakarta)] text-white"
      style={{ background: BG }}
    >
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

        {/* HERO */}
        <section className="grid items-center gap-12 py-14 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-2 lg:py-10">
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
              Tus clientes la guardan en su Wallet en segundos, sin instalar nada. Y cuando dejan de
              venir, les llega un WhatsApp solo.
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
                <strong className="text-white">24h</strong> con tu logo
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>
                <strong className="text-[#FFD700]">0 apps</strong> que instala tu cliente
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>Sellos · puntos · cashback</span>
            </motion.div>
          </div>
          <HeroCard />
        </section>

        {/* Showcase 4 tarjetas */}
        <section className="pb-8 pt-4">
          <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((card) => (
              <StaggerItem key={card.id}>
                <div className="flex flex-col items-center">
                  <MiniLoyaltyCard card={card} />
                  <div className="mt-3 text-center">
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

        {/* Cómo acumulan */}
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

        {/* Fases */}
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

        {/* Chat reactivación */}
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
              businessName="Café Alcalá"
              accent="#25D366"
              messages={HERO_CHAT}
              compact
            />
          </ScrollReveal>
        </section>

        {/* Giros */}
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
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <ScrollReveal key={`${industry.id}-card`}>
              <div className="flex justify-center lg:justify-start">
                <MiniLoyaltyCard card={industryCard} />
              </div>
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

        {/* Panel */}
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
                      ['Jorge Aguilar', 'hoy · 22 visitas'],
                      ['Diego Cetz', 'hoy · 31 visitas'],
                    ],
                  },
                  {
                    title: 'En riesgo',
                    color: GOLD,
                    count: '68',
                    rows: [
                      ['Marisol Peña', '14 días · 9 visitas'],
                      ['Paola Herrera', '9 días · 14 visitas'],
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

        {/* Precios */}
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
                    'Sellos, puntos o cashback — tú eliges',
                    'Google Wallet + acceso PWA',
                    'WhatsApp automático por inactividad',
                    'QR de reseñas de Google',
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

        {/* Convertir */}
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
