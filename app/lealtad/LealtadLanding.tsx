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
  'Hola Agentia, vi la landing de lealtad y quiero una tarjeta digital para mi negocio. ¿Me orientan?',
);

const HERO_CHAT: ChatLine[] = [
  { from: 'bot', text: 'Marisol Peña — 14 días sin visitar. Tenía 5 de 8 sellos.' },
  {
    from: 'bot',
    text: 'Hola Marisol 👋 te extrañamos en Café Alcalá. Tu sello #6 va por cuenta de la casa esta semana ☕',
  },
  { from: 'user', text: '¡Qué bueno! Paso mañana en la mañana 🙌' },
];

const INDUSTRIES = [
  {
    id: 'barber',
    label: 'Barberías',
    title: 'El ciclo de corte no se olvida solo',
    desc: 'Cuando alguien se pasa de sus 4 semanas, el sistema manda el recordatorio antes de que pruebe otro barbero.',
    chat: [
      { from: 'bot' as const, text: 'Diego — 32 días desde su último corte (ciclo normal: 28).' },
      {
        from: 'bot' as const,
        text: 'Hola Diego 👋 ya se cumplieron tus 4 semanas. Tu corte #10 va por la casa ✂️ ¿Agendamos sábado?',
      },
    ],
  },
  {
    id: 'cafe',
    label: 'Cafeterías',
    title: 'Alta frecuencia, cero fricción',
    desc: 'Trae de vuelta al cliente de la rutina diaria antes de que se acostumbre a otro café de la esquina.',
    chat: [
      { from: 'bot' as const, text: 'Marisol — 9 días sin café. 5 sellos acumulados.' },
      {
        from: 'bot' as const,
        text: 'Hola Marisol 👋 tu café #6 va por cuenta de la casa esta semana ☕',
      },
    ],
  },
  {
    id: 'resto',
    label: 'Restaurantes',
    title: 'Premio que protege el ticket',
    desc: 'Postre o platillo gratis en lugar de descuento en efectivo — recuperas visitas sin bajar margen.',
    chat: [
      { from: 'bot' as const, text: 'Jorge — 21 días sin visitar Casa Nola.' },
      {
        from: 'bot' as const,
        text: 'Hola Jorge 👋 vuelve por tu postre de la casa gratis en tu próxima visita 🍰',
      },
    ],
  },
  {
    id: 'spa',
    label: 'Spas',
    title: 'Mayor margen, mejor justificación',
    desc: 'Sesiones espaciadas: un mensaje a tiempo reactiva la agenda sin que el cliente “se olvide” de cuidarse.',
    chat: [
      { from: 'bot' as const, text: 'Paola — 18 días desde su último masaje.' },
      {
        from: 'bot' as const,
        text: 'Hola Paola 👋 20% en tu próximo masaje si agendas esta semana 💆',
      },
    ],
  },
] as const;

const PHASES = [
  {
    n: '01',
    title: 'Acumula',
    desc: 'Escanean un QR, suman sellos. Tarjeta en Google Wallet o acceso directo — sin instalar app.',
  },
  {
    n: '02',
    title: 'Detecta',
    desc: 'Cada visita con fecha. El panel clasifica: activos, en riesgo o perdidos.',
  },
  {
    n: '03',
    title: 'Reactiva',
    desc: 'Si se enfrían, sale un WhatsApp automático por la API oficial de Meta.',
  },
];

function LoyaltyCardVisual() {
  const reduceMotion = useReducedMotion();
  const filled = 5;
  const total = 8;

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
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#12161d] via-[#0d1118] to-[#0a0a0a] p-6 shadow-[0_40px_80px_-40px_rgba(0,212,255,0.45)]"
        whileHover={reduceMotion ? undefined : { y: -4, rotateY: -3, rotateX: 2 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="font-[family-name:var(--font-space)] text-[11px] uppercase tracking-[0.14em] text-[#00D4FF]">
              Café Alcalá
            </p>
            <p className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold text-white">
              Marisol Peña
            </p>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl font-[family-name:var(--font-space)] text-sm font-bold text-[#0a0a0a]"
            style={{ background: `linear-gradient(135deg, ${CYAN}, ${GOLD})` }}
          >
            CA
          </div>
        </div>

        <p className="mb-3 text-xs text-white/45">Sellos · 8 visitas = café gratis</p>
        <div className="mb-5 flex flex-wrap gap-2.5">
          {Array.from({ length: total }).map((_, i) => (
            <motion.span
              key={i}
              className="h-8 w-8 rounded-full border-2"
              initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                borderColor: i < filled ? CYAN : 'rgba(255,255,255,0.12)',
                background:
                  i < filled
                    ? `linear-gradient(135deg, ${CYAN}, ${GOLD})`
                    : 'transparent',
                boxShadow: i < filled ? `0 0 14px ${CYAN}55` : 'none',
              }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <span className="text-xs text-white/55">Google Wallet</span>
          <span className="text-[10px] text-white/35">Apple · próximamente</span>
        </div>

        <motion.div
          className="mt-4 overflow-hidden rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 px-3 py-2.5 text-[12px] leading-snug text-white/85"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <span className="mb-1 block font-[family-name:var(--font-space)] text-[10px] uppercase tracking-wider text-[#25D366]">
            WhatsApp automático
          </span>
          Tu sello #6 va por cuenta de la casa esta semana ☕
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function ConvertChat() {
  const [giro, setGiro] = useState<string | null>(null);

  const options = ['Cafetería', 'Barbería', 'Restaurante', 'Spa / estética', 'Otro'];

  function pick(label: string) {
    setGiro(label);
  }

  const wa = agentiaWhatsAppUrl(
    `Hola Agentia, vi /lealtad. Tengo un negocio de ${giro || 'mi giro'} y quiero tarjeta de lealtad digital. ¿Me ayudan a activarla?`,
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
              onClick={() => pick(o)}
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
                Perfecto para {giro.toLowerCase()}. Planes desde $299/mes. Escíbeme por WhatsApp y te
                paso la demo con tu marca.
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
            <a href="#como" className="transition-colors hover:text-[#00D4FF]">
              Cómo funciona
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

        {/* HERO — una composición */}
        <section className="grid items-center gap-12 py-14 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-2 lg:py-10">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0, 0.35)}
              className="mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fidelización con WhatsApp real
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.06, 0.45)}
              className="font-[family-name:var(--font-space)] text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]"
            >
              La tarjeta que sabe{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                quién no ha vuelto
              </span>
              .
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.12, 0.4)}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
            >
              Sellos digitales, panel de riesgo y WhatsApp automático cuando un cliente se enfría —
              antes de que se vaya con la competencia.
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
                <strong className="text-white">24h</strong> para activar con tu logo
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>
                <strong className="text-[#FFD700]">0 apps</strong> que instala tu cliente
              </span>
              <span className="hidden text-white/20 sm:inline">|</span>
              <span>Partner oficial Meta</span>
            </motion.div>
          </div>
          <LoyaltyCardVisual />
        </section>

        <section id="como" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Cómo funciona
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Tres pasos. Cero trabajo manual.
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Atiendes como siempre. Agentia vigila las fechas y actúa cuando alguien se aleja.
            </p>
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
              businessName="Café Alcalá"
              accent="#25D366"
              messages={HERO_CHAT}
              compact
            />
          </ScrollReveal>
        </section>

        <section id="giros" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Tu giro
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              El mensaje correcto para tu tipo de negocio
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Misma lógica de retención — distinto premio y timing.
            </p>
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
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
            <ScrollReveal key={industry.id}>
              <h3 className="font-[family-name:var(--font-space)] text-2xl font-bold">
                {industry.title}
              </h3>
              <p className="mt-3 text-white/55">{industry.desc}</p>
            </ScrollReveal>
            <ScrollReveal delay={0.06} key={`${industry.id}-chat`}>
              <ModernChatPreview
                businessName={industry.label}
                accent={CYAN}
                messages={industry.chat}
                compact
              />
            </ScrollReveal>
          </div>
        </section>

        <section className="py-12">
          <ScrollReveal>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-3">
                <span className="font-mono text-[11px] text-white/40">
                  panel · lealtad · simulación
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
                    'Google Wallet + acceso PWA',
                    'WhatsApp automático por inactividad',
                    'QR de reseñas de Google',
                    'Panel por segmento',
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
                <p className="mt-1 text-sm text-white/45">Para crecer más rápido</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-white/75">
                  {[
                    'Todo lo del Básico',
                    'Hasta 3 sucursales',
                    'Mensajes de cumpleaños',
                    'Promos a segmentos manuales',
                    'Exportar base de clientes',
                    'Soporte prioritario por WhatsApp',
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
            <span className="font-mono text-white/70">$399–$700 MXN/mes</span> y dependen del wallet.
            Nosotros llegamos por WhatsApp.
          </p>
        </section>

        <section id="escribir" className="py-16 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <ScrollReveal>
              <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
                Empieza hoy
              </p>
              <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
                Elige tu giro y escribe. En 24h tienes tu tarjeta con tu marca.
              </h2>
              <p className="mt-4 text-white/55">
                Sin contratos largos ni instalación técnica de tu parte. Mándanos el logo por WhatsApp
                y nosotros conectamos todo.
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

      {/* FAB WhatsApp — conversión siempre visible */}
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
