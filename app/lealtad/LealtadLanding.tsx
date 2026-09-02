'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { ScrollReveal, StaggerItem, StaggerReveal } from '@/components/landing/ScrollReveal';
import { revealTransition } from '@/components/landing/motion';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';
import { trackEvent, useAnalytics } from '@/src/lib/analytics-client';
import { RoiCalculator } from './RoiCalculator';
import { CountUp } from './CountUp';
import { SequenceReveal } from './SequenceReveal';
import { TrafficLightDemo } from '@/components/TrafficLightDemo';
import Navbar from '@/components/shared/Navbar';

const BG = '#FAFAF8';
const INK = '#14161A';
const BRONZE = '#B8935A';
const WA = '#25D366';

const IMG_WALLET =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788197678/WhatsApp_Image_2026-08-31_at_11.19.45_AM_pkbm3z.jpg';
const IMG_CAJA =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788157350/captura-caja-venta_fitq6s.jpg';

const WA_GROWTH = agentiaWhatsAppUrl(
  'Hola Agentia, quiero aumentar mis ventas con el sistema de recompra. ¿Cómo arranco?',
);
const WA_PLAN = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan base de lealtad ($399 MXN/mes). ¿Cómo arranco?',
);
const WA_SELLER = agentiaWhatsAppUrl(
  'Hola, quiero información sobre ser vendedor de Agentia Lealtad',
);

const LEALTAD_ANALYTICS = 'lealtad-agentia';

function trackCta(cta: string) {
  trackEvent('cta_click', LEALTAD_ANALYTICS, { cta });
}

const BADGES = [
  'Android y iPhone',
  'Sin app nueva',
  'Listo en 24h',
  'Se usa en segundos',
];

const BENEFITS = [
  { icon: Wallet, title: 'Pase siempre en su celular' },
  { icon: MessageCircle, title: 'Te avisa quién se está yendo', whatsapp: true },
  { icon: Users, title: 'Ves activos, en riesgo e inactivos' },
  { icon: TrendingUp, title: 'Más visitas, menos anuncios' },
  { icon: Zap, title: 'Cumpleaños listos para que tú mandes' },
  { icon: Sparkles, title: 'Sellos, puntos o cashback' },
];

const GIROS = [
  'Cafeterías',
  'Barberías',
  'Restaurantes',
  'Estéticas',
  'Veterinarias',
  'Gimnasios',
  'Boutiques',
  'Farmacias',
  'Papelerías',
  'Abarrotes',
  'Tacos / comida rápida',
];

const AUTOMATIONS = [
  { t: 'Cumpleaños', d: 'Te avisa el día. El mensaje ya está listo.' },
  { t: 'Inactivos', d: 'Tú decides a quién recuperar, el mensaje ya está listo' },
  { t: 'Promociones', d: 'Ofertas listas para quien ya te compra' },
  { t: 'Clientes VIP', d: 'Ves quién más gasta — tú los premias' },
  { t: 'Referidos', d: 'Quien te recomienda, suma' },
  { t: 'Recordatorios', d: 'Cortes, citas y membresías — tú das el toque' },
];

const COMPARE = [
  { paper: 'Se pierde o se moja', agentia: 'Vive en el celular, siempre a la mano' },
  { paper: 'Nadie la trae la próxima vez', agentia: 'Se abre en Wallet en un toque' },
  { paper: 'No sabes quién dejó de venir', agentia: 'Ves activos, en riesgo y perdidos' },
  { paper: 'Cero seguimiento', agentia: 'Te avisa quién se está yendo — mandas el WhatsApp en un toque' },
  { paper: 'No escala con tu negocio', agentia: 'Crece con sucursales y segmentos' },
];

const METRICS = [
  { end: 28, label: 'clientes recurrentes' },
  { end: 35, label: 'visitas recuperadas' },
  { end: 18, label: 'ticket promedio' },
];

const NFC_ACTIONS = [
  'Google Reviews',
  'WhatsApp',
  'Menú',
  'Lealtad',
  'Promociones',
  'Instagram',
  'Agenda',
  'Encuesta',
];

const REVIEW_STEPS = [
  { n: '01', title: 'Termina su compra' },
  { n: '02', title: 'Escanea o toca' },
  { n: '03', title: 'Se abre Google Reviews' },
  { n: '04', title: 'Recibe su recompensa' },
];

const REVIEW_METRICS = [
  { value: 'Más confianza', label: 'Más estrellas, más eligen' },
  { value: 'Más llamadas', label: 'Mejores reseñas, más visitas' },
  { value: 'Mejor en Maps', label: 'Apareces cuando buscan cerca' },
];

const ECOSYSTEM = [
  'Chatbot IA',
  'WhatsApp',
  'Lealtad',
  'Alertas',
  'Google Reviews',
  'Más clientes',
];

const FAQS = [
  {
    q: '¿Descargan una app?',
    a: 'No. Guardan el pase en Google Wallet o lo abren en el navegador.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Con tu logo, el pase puede estar activo en 24 horas.',
  },
  {
    q: '¿Y si no sé de tecnología?',
    a: 'El cliente muestra el QR, sumas la visita. El sistema te dice quién se está yendo; tú mandas el mensaje.',
  },
  {
    q: '¿Puedo cancelar?',
    a: 'Sí. Sin contratos eternos.',
  },
  {
    q: '¿Se paga solo?',
    a: 'Si vuelven unos cuantos al mes, el plan de $399 suele cubrirse. Usa el simulador.',
  },
  {
    q: '¿Sirve para mi giro?',
    a: 'Sí, si vives de clientes que deberían volver. Sellos, puntos o cashback según tu negocio.',
  },
];

function WaButton({
  href,
  children,
  onClick,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-[transform] duration-150 hover:-translate-y-px active:scale-[0.97] ${className}`}
      style={{ background: WA }}
    >
      {children}
    </a>
  );
}

function GhostButton({
  href,
  children,
  onClick,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <span
      className={`inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold ring-1 ring-[#14161A]/15 transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-white active:scale-[0.97] ${className}`}
      style={{ color: INK }}
    >
      {children}
    </span>
  );
  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {inner}
    </a>
  );
}

function ShotFrame({
  src,
  alt,
  width,
  height,
  priority,
  cropTop,
  className = '',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  cropTop?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.75rem] bg-[#EFEDE6] p-1.5 ring-1 ring-[#14161A]/8 ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[1.35rem] bg-white ${
          cropTop ? 'h-[min(72vh,620px)]' : ''
        }`}
      >
        {cropTop ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-top"
            quality={90}
            priority={priority}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full"
            quality={90}
            priority={priority}
            sizes="(max-width: 768px) 92vw, 440px"
          />
        )}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#14161A]/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-semibold sm:text-base" style={{ color: INK }}>
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#14161A]/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm leading-relaxed text-[#14161A]/60">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LealtadLanding() {
  const reduceMotion = useReducedMotion();
  useAnalytics(LEALTAD_ANALYTICS);

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden" style={{ background: BG, color: INK }}>
      <Navbar
        theme="light"
        ctaHref={WA_GROWTH}
        ctaLabel="Escríbenos"
        pageLinks={[
          { href: '#simulador', label: 'Simulador' },
          { href: '#giros', label: 'Tu giro' },
          { href: '#plan', label: 'Plan' },
        ]}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        {/* 1. HERO */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0, 0.35)}
              className="mb-4 text-sm font-medium tracking-wide"
              style={{ color: BRONZE }}
            >
              Plan base · $399 MXN/mes
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.06, 0.45)}
              className="text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.85rem]"
            >
              Haz que tus clientes{' '}
              <em className="not-italic font-bold" style={{ color: BRONZE }}>
                regresen una y otra vez.
              </em>
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.12, 0.4)}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#14161A]/60 sm:text-lg"
            >
              Te avisa quién se está yendo. Tú mandas el WhatsApp en un toque.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.18, 0.35)}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <WaButton href={WA_GROWTH} onClick={() => trackCta('hero-ventas')}>
                Empezar ahora
              </WaButton>
              <GhostButton href="#demo" onClick={() => trackCta('hero-demo')}>
                Ver demostración
              </GhostButton>
            </motion.div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#14161A]/55">
              {BADGES.map((b) => (
                <li key={b} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div id="demo" className="mx-auto mt-12 max-w-[440px]">
            <div className="lealtad-hero-shot">
              <ShotFrame
                src={IMG_WALLET}
                alt="Tarjeta de lealtad de Café Luna en Google Wallet, con puntos, saldo y código QR"
                width={938}
                height={1556}
                priority
              />
            </div>
          </div>
        </section>

        {/* 2. PROBLEMA */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto dinero se te va cada mes?
            </h2>
          </ScrollReveal>
          <StaggerReveal className="mt-12 grid gap-4 md:grid-cols-3">
            <StaggerItem>
              <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
                <p className="text-4xl font-bold" style={{ color: BRONZE }}>
                  <CountUp end={5} suffix="×" />
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#14161A]/55">
                  más caro atraer un cliente nuevo
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
                <p className="text-4xl font-bold" style={{ color: BRONZE }}>
                  <CountUp end={60} />–<CountUp end={70} suffix="%" />
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#14161A]/55">
                  de ventas vienen de quien ya te conoce
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
                <p className="text-4xl font-bold" style={{ color: BRONZE }}>
                  0
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#14161A]/55">
                  seguimiento = clientes que se van
                </p>
              </div>
            </StaggerItem>
          </StaggerReveal>
        </section>

        {/* 3. ANTES VS DESPUÉS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Del “gracias, adiós” al cliente que vuelve solo
            </h2>
          </ScrollReveal>
          <SequenceReveal />
        </section>

        {/* Así funciona por dentro */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Así funciona por dentro
            </h2>
          </ScrollReveal>

          <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <p className="text-sm font-medium" style={{ color: BRONZE }}>
                Registrar venta
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">Cobra, suma puntos, listo</h3>
              <p className="mt-4 text-[#14161A]/60">Cobra, suma puntos y envía el pase.</p>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <ShotFrame
                src={IMG_CAJA}
                alt="Pantalla de caja de Café Luna: venta registrada, puntos ganados y botón para enviar la tarjeta por WhatsApp"
                width={1079}
                height={2132}
                cropTop
              />
            </ScrollReveal>
          </div>

          <div className="mt-20">
            <ScrollReveal>
              <p className="text-sm font-medium" style={{ color: BRONZE }}>
                Panel de clientes
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">Semáforo de quién vuelve</h3>
              <p className="mt-4 max-w-2xl text-[#14161A]/60">
                Activo, en riesgo o inactivo. Tú decides a quién escribir — el mensaje ya está listo.
              </p>
            </ScrollReveal>
            <div className="mt-8">
              <TrafficLightDemo />
            </div>
          </div>
        </section>

        {/* 4. SIMULADOR */}
        <section id="simulador" className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto ganas si vuelven un poco más?
            </h2>
          </ScrollReveal>
          <div className="mt-10">
            <RoiCalculator />
          </div>
        </section>

        {/* 5. BENEFICIOS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Ves quién se enfría. Tú escribes.</h2>
          </ScrollReveal>
          <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title}>
                <div className="h-full rounded-[1.5rem] bg-white p-6 ring-1 ring-[#14161A]/8">
                  <b.icon
                    className="h-5 w-5"
                    style={{ color: 'whatsapp' in b && b.whatsapp ? WA : BRONZE }}
                  />
                  <h3 className="mt-4 text-lg font-bold leading-snug">{b.title}</h3>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 6. INDUSTRIAS */}
        <section id="giros" className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Hecho para tu giro</h2>
          </ScrollReveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {GIROS.map((giro) => (
              <span
                key={giro}
                className="rounded-full bg-white px-3.5 py-2 text-sm font-medium text-[#14161A]/75 ring-1 ring-[#14161A]/10"
              >
                {giro}
              </span>
            ))}
          </div>
        </section>

        {/* 7. AUTOMATIZACIONES */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Te avisa a quién escribir
            </h2>
          </ScrollReveal>
          <div className="relative mt-12">
            <div className="absolute bottom-2 left-[15px] top-2 w-px bg-[#14161A]/10 sm:left-[19px]" />
            <ul className="space-y-6">
              {AUTOMATIONS.map((a, i) => (
                <ScrollReveal key={a.t} delay={i * 0.04}>
                  <li className="relative flex gap-5 pl-1">
                    <span className="relative z-[1] mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold ring-1 ring-[#14161A]/10 sm:h-10 sm:w-10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="rounded-2xl bg-white px-5 py-4 ring-1 ring-[#14161A]/8">
                      <h3 className="text-lg font-bold">{a.t}</h3>
                      <p className="mt-1 text-sm text-[#14161A]/55">{a.d}</p>
                    </div>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </section>

        {/* NFC */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Una tarjeta NFC, un toque, reseña o WhatsApp
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">Complemento físico. Sin apps nuevas.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {NFC_ACTIONS.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#14161A]/70 ring-1 ring-[#14161A]/10"
                >
                  {a}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Reseñas Google */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Más reseñas de Google, sin perseguir
            </h2>
          </ScrollReveal>

          <StaggerReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_STEPS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="h-full rounded-[1.5rem] bg-white p-5 ring-1 ring-[#14161A]/8">
                  <span className="text-xs font-semibold" style={{ color: BRONZE }}>
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-base font-bold leading-snug">{s.title}</h3>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-[1.5rem] bg-white p-6 ring-1 ring-[#B8935A]/25">
                <div className="flex items-center gap-2" style={{ color: BRONZE }}>
                  <Star className="h-4 w-4 fill-[#B8935A]" />
                  <span className="text-sm font-semibold">4–5 estrellas</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#14161A]/65">
                  Van a Google Reviews. Tú publicas lo que suma.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <div className="h-full rounded-[1.5rem] bg-white p-6 ring-1 ring-[#14161A]/8">
                <div className="flex items-center gap-2 text-[#14161A]">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-semibold">Menos de 4 estrellas</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#14161A]/55">
                  Se queda interno. Tú ves el feedback, Maps no.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <StaggerReveal className="mt-8 grid gap-4 md:grid-cols-3">
            {REVIEW_METRICS.map((m) => (
              <StaggerItem key={m.value}>
                <div className="rounded-[1.5rem] bg-white p-6 text-center ring-1 ring-[#14161A]/8">
                  <p className="text-lg font-bold">{m.value}</p>
                  <p className="mt-2 text-sm text-[#14161A]/50">{m.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 8. COMPARATIVA */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Tarjeta de papel vs Agentia</h2>
          </ScrollReveal>
          <div className="mt-10 overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[#14161A]/8">
            <div className="grid grid-cols-2 bg-[#F3F1EC] px-4 py-3 text-xs font-semibold uppercase tracking-wider sm:px-6 sm:text-sm">
              <span className="text-[#14161A]/45">Tarjeta de papel</span>
              <span style={{ color: BRONZE }}>Agentia</span>
            </div>
            {COMPARE.map((row) => (
              <div
                key={row.paper}
                className="grid grid-cols-1 gap-3 border-t border-[#14161A]/8 px-4 py-4 sm:grid-cols-2 sm:gap-6 sm:px-6"
              >
                <p className="text-sm text-[#14161A]/40 line-through decoration-[#14161A]/15">{row.paper}</p>
                <p className="text-sm font-medium text-[#14161A]">{row.agentia}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. MÉTRICAS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Números, no “bonito”</h2>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
            {METRICS.map((m) => (
              <StaggerItem key={m.label}>
                <div className="rounded-[1.5rem] bg-white p-8 text-center ring-1 ring-[#14161A]/8">
                  <p className="text-5xl font-bold" style={{ color: BRONZE }}>
                    <CountUp end={m.end} prefix="+" suffix="%" />
                  </p>
                  <p className="mt-3 text-lg font-semibold">{m.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 10. PLAN */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Se paga solo si vuelven unos cuantos
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div
              id="plan"
              className="relative mx-auto mt-10 max-w-lg rounded-[1.75rem] bg-white p-7 ring-1 ring-[#B8935A]/30 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">Plan base</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: BRONZE }}>
                $399
                <span className="ml-1 text-sm font-medium text-[#14161A]/40">MXN/mes</span>
              </p>
              <p className="mt-2 text-sm text-[#14161A]/50">
                ¿Más de una sucursal? +$150 MXN/mes por cada sucursal adicional
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#14161A]/70">
                {[
                  '1 sucursal',
                  'Tarjetas ilimitadas',
                  'Sellos, puntos o cashback (el negocio elige)',
                  'Google Wallet + acceso PWA',
                  'Alerta de inactividad: tú mandas el WhatsApp en un toque',
                  'Panel de clientes con semáforo de reactivación',
                  'Aviso de cumpleaños con el mensaje listo',
                  'Soporte por WhatsApp incluido',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href={WA_PLAN}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCta('plan-499')}
                className="mt-7 inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.97]"
                style={{ background: WA }}
              >
                Empezar ahora
              </a>
            </div>
          </ScrollReveal>
        </section>

        {/* 11. VENDEDORES */}
        <section id="vendedores" className="py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Buscamos vendedores</h2>
              <p className="mt-4 max-w-xl text-[#14161A]/55">
                Comisión recurrente por cada negocio que traigas. Sin inversión.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-[#14161A]/70">
                {[
                  'Sin cuota de entrada',
                  'Ganas más entre más vendas',
                  'Demo y material desde el día uno',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <WaButton href={WA_SELLER} onClick={() => trackCta('vendedores')}>
                  Escríbenos
                </WaButton>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="relative isolate overflow-hidden py-6 lg:py-10">
                <p className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
                  Traes el negocio.
                  <br />
                  <span style={{ color: BRONZE }}>Ellos se quedan.</span>
                  <br />
                  Tú sigues ganando.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 12. FAQ */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Preguntas</h2>
          </ScrollReveal>
          <div className="mx-auto mt-10 max-w-3xl">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 text-center sm:py-20">
          <ScrollReveal>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              La meta es una: <span style={{ color: BRONZE }}>vender más.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#14161A]/55">Mándanos tu logo. En 24h está listo.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <WaButton href={WA_GROWTH} onClick={() => trackCta('cierre-ventas')}>
                Empezar ahora
              </WaButton>
            </div>
          </ScrollReveal>
        </section>

        {/* Ecosistema */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold sm:text-4xl">
              Un solo sistema, más clientes en la puerta
            </h2>
          </ScrollReveal>
          <ol className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            {ECOSYSTEM.map((node, i) => (
              <li key={node} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold sm:text-sm ${
                    node === 'WhatsApp'
                      ? 'text-white'
                      : 'bg-white text-[#14161A] ring-1 ring-[#14161A]/10'
                  }`}
                  style={node === 'WhatsApp' ? { background: WA } : undefined}
                >
                  {node}
                </span>
                {i < ECOSYSTEM.length - 1 ? (
                  <ArrowRight className="hidden h-3.5 w-3.5 text-[#14161A]/25 sm:block" />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-[#14161A]/10 pt-8 text-center text-sm text-[#14161A]/40">
          <Link href="/" className="text-[#14161A]/60 hover:text-[#14161A]">
            agentia.software
          </Link>
          {' · '}
          Crecimiento para negocios locales · Partner oficial Meta
        </footer>
      </div>

      <a
        href={WA_GROWTH}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCta('whatsapp-flotante')}
        className="fixed bottom-5 right-5 z-[60] flex h-14 items-center gap-2 rounded-full pl-3.5 pr-4 text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition hover:scale-105 active:scale-95"
        style={{ background: WA }}
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="text-sm font-semibold">WhatsApp</span>
      </a>
    </main>
  );
}
