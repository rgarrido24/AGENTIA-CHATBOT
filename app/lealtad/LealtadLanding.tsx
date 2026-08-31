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

const BG = '#FAFAF8';
const INK = '#14161A';
const BRONZE = '#B8935A';
const WA = '#25D366';

const IMG_WALLET =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788157349/captura-tarjeta-wallet_grbubg.jpg';
const IMG_CAJA =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788157350/captura-caja-venta_fitq6s.jpg';
const IMG_CLIENTES =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788157351/captura-clientes-semaforo_zbcqtw.jpg';

const WA_GROWTH = agentiaWhatsAppUrl(
  'Hola Agentia, quiero aumentar mis ventas con el sistema de recompra. ¿Cómo arranco?',
);
const WA_DEMO = agentiaWhatsAppUrl(
  'Hola Agentia, quiero ver una demostración del sistema para mi negocio.',
);
const WA_PLAN = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan único de lealtad ($499 MXN/mes). ¿Cómo arranco?',
);
const WA_SELLER = agentiaWhatsAppUrl(
  'Hola, quiero información sobre ser vendedor de Agentia Lealtad',
);

const LEALTAD_ANALYTICS = 'lealtad-agentia';

function trackCta(cta: string) {
  trackEvent('cta_click', LEALTAD_ANALYTICS, { cta });
}

const BADGES = [
  'Funciona en Android y iPhone',
  'Sin descargar apps',
  'Configuración rápida',
  'Tus clientes lo usan en segundos',
];

const PROBLEM_STATS = [
  {
    value: '5×',
    label: 'más caro conseguir un cliente nuevo que hacer regresar uno',
  },
  {
    value: '60–70%',
    label: 'de tus ventas suelen venir de clientes que ya te conocen',
  },
  {
    value: '0',
    label: 'seguimiento = dinero que se va por la puerta sin que lo notes',
  },
];

const AFTER_STEPS = [
  'Compra',
  'Guarda su pase',
  'Acumula',
  'Recibe promo',
  'Regresa',
  'Compra otra vez',
  'Trae amigos',
];

const BENEFITS = [
  {
    icon: Wallet,
    title: 'Tus clientes nunca olvidan tu negocio',
    desc: 'Su pase vive en el celular. Cada vez que abren la cartera, te ven. Sin app nueva, sin fricción.',
  },
  {
    icon: MessageCircle,
    title: 'Promociones directo al bolsillo',
    desc: 'Cuando alguien deja de venir, el sistema le escribe por WhatsApp. Tú no persigues a nadie.',
    whatsapp: true,
  },
  {
    icon: Users,
    title: 'Sabes quién compra y quién se fue',
    desc: 'Mira activos, en riesgo y perdidos. Enfoca el esfuerzo donde recuperas dinero de verdad.',
  },
  {
    icon: TrendingUp,
    title: 'Más visitas sin gastar más en anuncios',
    desc: 'La recompra baja tu costo de adquisición. Creces con la base que ya pagaste por atraer.',
  },
  {
    icon: Zap,
    title: 'Un empleado que nunca duerme',
    desc: 'Cumpleaños, inactivos, VIP y recordatorios corren solos. Tú atiendes. El sistema recupera.',
  },
  {
    icon: Sparkles,
    title: 'Se siente justo — y vuelve',
    desc: 'Sellos, puntos o cashback adaptados a tu giro. El cliente siente el premio; tú proteges el margen.',
  },
];

type Industry = {
  id: string;
  label: string;
  icon: string;
  example: string;
  logoSrc?: string;
  logoAlt?: string;
};

const INDUSTRIES: Industry[] = [
  {
    id: 'cafe',
    label: 'Cafeterías',
    icon: '☕',
    logoSrc: '/images/mockups/cafe-luna-logo.jpg',
    logoAlt: 'Café Luna',
    example: 'Café #10 gratis → la rutina matutina se queda contigo.',
  },
  {
    id: 'barber',
    label: 'Barberías',
    icon: '✂️',
    example: 'Corte #10 por la casa + recordatorio a las 4 semanas.',
  },
  {
    id: 'resto',
    label: 'Restaurantes',
    icon: '🍽️',
    example: 'Postre de la casa al volver — sin bajar el ticket con descuentos.',
  },
  {
    id: 'spa',
    label: 'Estéticas',
    icon: '🌿',
    example: 'Sesión con puntos + WhatsApp cuando se pasa la cita.',
  },
  {
    id: 'vet',
    label: 'Veterinarias',
    icon: '🐾',
    example: 'Vacunas y consultas que regresan a tiempo, no cuando duele.',
  },
  {
    id: 'gym',
    label: 'Gimnasios',
    icon: '💪',
    example: 'Check-ins que empujan constancia y renuevan membresías.',
  },
  {
    id: 'boutique',
    label: 'Boutiques',
    icon: '👗',
    example: 'Cashback que trae la segunda compra sin liquidar margen.',
  },
  {
    id: 'farmacia',
    label: 'Farmacias',
    icon: '💊',
    example: 'Recompra de tratamientos recurrentes, no solo la urgencia.',
  },
  {
    id: 'papel',
    label: 'Papelerías',
    icon: '📎',
    example: 'Sellos en temporada escolar y clientes que vuelven todo el año.',
  },
];

const AUTOMATIONS = [
  {
    t: 'Cumpleaños',
    d: 'Un mensaje el día correcto. Se siente personal — y dispara una visita.',
  },
  {
    t: 'Inactivos',
    d: 'Detecta quién no ha venido y manda la promo antes de que prueben a otro.',
  },
  {
    t: 'Promociones',
    d: 'Lanza ofertas a quien ya te conoce. Menos desperdicio que un anuncio frío.',
  },
  {
    t: 'Clientes VIP',
    d: 'Premia a los que más gastan. Ellos traen el ticket alto y a sus amigos.',
  },
  {
    t: 'Referidos',
    d: 'Quien te recomienda suma. Creces con boca a boca medible.',
  },
  {
    t: 'Recordatorios',
    d: 'Cortes, sesiones, vacunas, membresías: el timing correcto sin agenda mental.',
  },
];

const COMPARE = [
  { paper: 'Se pierde o se moja', agentia: 'Vive en el celular, siempre a la mano' },
  { paper: 'Nadie la trae la próxima vez', agentia: 'Se abre en Wallet en un toque' },
  { paper: 'No sabes quién dejó de venir', agentia: 'Ves activos, en riesgo y perdidos' },
  { paper: 'Cero seguimiento', agentia: 'WhatsApp automático cuando se enfrían' },
  { paper: 'No escala con tu negocio', agentia: 'Crece con sucursales y segmentos' },
];

const METRICS = [
  { value: '+28%', label: 'clientes recurrentes', note: 'negocios similares en recompra' },
  { value: '+35%', label: 'visitas recuperadas', note: 'con seguimiento a inactivos' },
  { value: '+18%', label: 'ticket promedio', note: 'cuando el premio protege margen' },
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
  {
    n: '01',
    title: 'Cliente termina su compra',
    desc: 'Sale contento del local — el momento perfecto para pedir la reseña.',
  },
  {
    n: '02',
    title: 'Escanea o toca su tarjeta',
    desc: 'QR de la tarjeta digital o toque NFC. Sin códigos impresos que nadie entiende.',
  },
  {
    n: '03',
    title: 'Se abre Google Reviews',
    desc: 'Con las estrellas listas para calificar. Menos clics, más reseñas publicadas.',
  },
  {
    n: '04',
    title: 'Recibe su recompensa',
    desc: 'Automático: sello, puntos o promo. La reseña deja de sentirse como un favor.',
  },
];

const REVIEW_METRICS = [
  {
    value: 'Más confianza',
    label: 'Las estrellas en Maps deciden si te eligen o al de enfrente.',
  },
  {
    value: 'Más llamadas',
    label: 'Negocios con mejores reseñas reciben más contactos y visitas.',
  },
  {
    value: 'Mejor en Maps',
    label: 'Más reseñas recientes ayudan a aparecer cuando buscan cerca.',
  },
];

const ECOSYSTEM = [
  'Chatbot IA',
  'WhatsApp',
  'Lealtad',
  'Automatización',
  'Google Reviews',
  'Más clientes',
];

const FAQS = [
  {
    q: '¿Mis clientes necesitan descargar una app?',
    a: 'No. Guardan el pase en Google Wallet (o lo abren en el navegador). Cero fricción — ideal si tu cliente no quiere instalar nada.',
  },
  {
    q: '¿Cuánto tarda en estar listo?',
    a: 'Con tu logo, en unas 24 horas puedes tener el pase activo. Nosotros conectamos; tú no instalas servidores ni “aprendes un software”.',
  },
  {
    q: '¿Y si no sé usar tecnología?',
    a: 'Está pensado para dueños de negocio, no para programadores. El día a día es simple: el cliente muestra el QR, sumas la visita, y el sistema hace el resto.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Sin contratos eternos. Si no te está trayendo recompra, no tiene sentido obligarte a quedarte.',
  },
  {
    q: '¿Esto se paga solo?',
    a: 'Si recuperas unos cuantos clientes al mes con tu ticket promedio, el plan de $499 suele cubrirse solo. Usa el simulador de arriba con tus números reales.',
  },
  {
    q: '¿Sirve para mi giro?',
    a: 'Si vives de clientes que deberían volver (café, cortes, comida, estética, vet, gym, tienda local…), sí. Adaptamos sellos, puntos o cashback a cómo compra tu gente.',
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
  const [industry, setIndustry] = useState<Industry>(INDUSTRIES[0]);
  useAnalytics(LEALTAD_ANALYTICS);

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden" style={{ background: BG, color: INK }}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
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
            <span className="text-lg font-bold">
              Agentia
              <span className="ml-1.5 font-medium" style={{ color: BRONZE }}>
                Crecimiento
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#14161A]/55 md:flex">
            <a href="#simulador" className="hover:text-[#14161A]">
              Simulador
            </a>
            <a href="#giros" className="hover:text-[#14161A]">
              Tu giro
            </a>
            <a href="#plan" className="hover:text-[#14161A]">
              Plan
            </a>
          </nav>
          <WaButton href={WA_GROWTH} onClick={() => trackCta('nav-whatsapp')}>
            Quiero vender más
          </WaButton>
        </header>

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
              Plan único · $499 MXN/mes
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
              Convierte visitas ocasionales en clientes frecuentes. El sistema acumula recompensas,
              detecta quién se enfría y los trae de vuelta — casi solo.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.18, 0.35)}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <WaButton href={WA_GROWTH} onClick={() => trackCta('hero-ventas')}>
                Quiero aumentar mis ventas
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
            <ShotFrame
              src={IMG_WALLET}
              alt="Tarjeta de lealtad de Café Luna en Google Wallet, con puntos, saldo y código QR"
              width={919}
              height={1294}
              priority
            />
          </div>
        </section>

        {/* 2. PROBLEMA */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto dinero estás perdiendo cada mes?
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              Traer un cliente nuevo es caro. Dejar ir a uno que ya te conoce es más caro todavía —
              porque ya invertiste en que te encontrara.
            </p>
          </ScrollReveal>
          <StaggerReveal className="mt-12 grid gap-4 md:grid-cols-3">
            {PROBLEM_STATS.map((s) => (
              <StaggerItem key={s.value}>
                <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
                  <p className="text-4xl font-bold" style={{ color: BRONZE }}>
                    {s.value}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#14161A]/55">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 3. ANTES VS DESPUÉS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Del “gracias, adiós” al cliente que vuelve solo
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">Antes</p>
                <ul className="mt-6 space-y-4">
                  {['Cliente compra', 'Se va', 'Nunca vuelve', 'Tú pagas otra vez por atraer a alguien nuevo'].map(
                    (t, i) => (
                      <li key={t} className="flex items-center gap-3 text-[#14161A]/55">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F1EC] text-xs font-medium text-[#14161A]/40">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#B8935A]/30">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRONZE }}>
                  Después
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {AFTER_STEPS.map((t, i) => (
                    <motion.span
                      key={t}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F3F1EC] px-3 py-1.5 text-sm text-[#14161A]"
                    >
                      <span className="text-[10px] font-semibold" style={{ color: BRONZE }}>
                        {i + 1}
                      </span>
                      {t}
                      {i < AFTER_STEPS.length - 1 ? (
                        <ArrowRight className="hidden h-3 w-3 text-[#14161A]/25 sm:inline" />
                      ) : null}
                    </motion.span>
                  ))}
                </div>
                <p className="mt-6 text-sm text-[#14161A]/55">
                  Menos publicidad. Más recompra. El crecimiento viene de la gente que ya te eligió.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Así funciona por dentro */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Así funciona por dentro
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              No es un mockup. Es el sistema real: registras la venta, el cliente guarda su pase, y
              ves quién está activo o se está enfriando.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <p className="text-sm font-medium" style={{ color: BRONZE }}>
                Registrar venta
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">Cobra, suma puntos, listo</h3>
              <p className="mt-4 text-[#14161A]/60">
                En caja registras el ticket. El sistema acredita puntos y deja el pase listo para
                enviarlo al cliente por WhatsApp.
              </p>
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

          <div className="mt-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal className="lg:order-2">
              <p className="text-sm font-medium" style={{ color: BRONZE }}>
                Panel de clientes
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">Semáforo de quién vuelve</h3>
              <p className="mt-4 text-[#14161A]/60">
                Activos, en riesgo e inactivos. Un toque y le escribes por WhatsApp a quien dejó de
                venir, antes de que pruebe al de enfrente.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.06} className="lg:order-1">
              <ShotFrame
                src={IMG_CLIENTES}
                alt="Panel de clientes de Café Luna con semáforo de inactividad: activos, en riesgo e inactivos, y contacto por WhatsApp"
                width={1079}
                height={4012}
                cropTop
              />
            </ScrollReveal>
          </div>
        </section>

        {/* 4. SIMULADOR */}
        <section id="simulador" className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto podrías ganar si solo un poco más de gente volviera?
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              Mueve los números de tu negocio. Si el ingreso extra cubre el plan, el sistema
              prácticamente se paga solo.
            </p>
          </ScrollReveal>
          <div className="mt-10">
            <RoiCalculator />
          </div>
        </section>

        {/* 5. BENEFICIOS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              No es software. Es crecimiento en automático.
            </h2>
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
                  <p className="mt-2 text-sm leading-relaxed text-[#14161A]/55">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 6. INDUSTRIAS */}
        <section id="giros" className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Hecho para el negocio de la esquina — y el que quiere crecer
            </h2>
          </ScrollReveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setIndustry(ind)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
                  industry.id === ind.id
                    ? 'text-[#14161A]'
                    : 'bg-white text-[#14161A]/65 ring-1 ring-[#14161A]/10 hover:text-[#14161A]'
                }`}
                style={industry.id === ind.id ? { background: BRONZE } : undefined}
              >
                {ind.logoSrc ? (
                  <span className="relative inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[#F5F0E8]">
                    <Image
                      src={ind.logoSrc}
                      alt=""
                      width={24}
                      height={24}
                      className="h-[118%] w-[118%] max-w-none object-cover object-center"
                    />
                  </span>
                ) : (
                  <span aria-hidden>{ind.icon}</span>
                )}
                {ind.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={industry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-8 overflow-hidden rounded-[1.5rem] bg-white p-8 ring-1 ring-[#14161A]/8 sm:p-10"
            >
              {industry.logoSrc ? (
                <div className="relative flex h-16 w-16 overflow-hidden rounded-full bg-[#F5F0E8] sm:h-20 sm:w-20">
                  <Image
                    src={industry.logoSrc}
                    alt={industry.logoAlt || industry.label}
                    width={96}
                    height={96}
                    className="h-[118%] w-[118%] max-w-none object-cover object-center"
                    quality={95}
                  />
                </div>
              ) : (
                <p className="text-4xl">{industry.icon}</p>
              )}
              <h3 className="mt-4 text-2xl font-bold">{industry.label}</h3>
              <p className="mt-3 max-w-xl text-base text-[#14161A]/65">{industry.example}</p>
              <a
                href={agentiaWhatsAppUrl(
                  `Hola Agentia, tengo un negocio de ${industry.label.toLowerCase()} y quiero más clientes frecuentes.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: WA }}
              >
                Quiero esto para mi {industry.label.toLowerCase()}
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* 7. AUTOMATIZACIONES */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Un empleado que recupera clientes mientras tú atiendes
            </h2>
            <p className="mt-3 max-w-2xl text-[#14161A]/55">
              No tienes que acordarte de quién falta. El sistema lo hace por ti.
            </p>
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
              Convierte clientes satisfechos en promotores de tu negocio
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              La Tarjeta Inteligente NFC es un complemento físico: el cliente acerca el teléfono y se
              abre exactamente lo que tú configuraste — sin apps nuevas ni explicar códigos.
            </p>
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
            <p className="mt-6 text-sm text-[#14161A]/45">
              Ideal en mostrador, mesa o paquete: un toque y el cliente ya está en Reviews, WhatsApp
              o tu programa de lealtad.
            </p>
          </ScrollReveal>
        </section>

        {/* Reseñas Google */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Consigue más reseñas de Google sin pedir códigos QR
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              El cliente termina, acerca el teléfono o abre su pase, califica y recibe recompensa. Tú
              no persigues a nadie con un papelito.
            </p>
          </ScrollReveal>

          <StaggerReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_STEPS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="h-full rounded-[1.5rem] bg-white p-5 ring-1 ring-[#14161A]/8">
                  <span className="text-xs font-semibold" style={{ color: BRONZE }}>
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-base font-bold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#14161A]/55">{s.desc}</p>
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
                  Lo mandamos directo a Google Reviews. Publicas lo que suma reputación y
                  posicionamiento.
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
                  Se guarda en un formulario interno. Tú ves el feedback y puedes recuperarlo — sin que
                  dañe tu reputación pública en Maps.
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
            <h2 className="text-3xl font-bold sm:text-4xl">No vendemos “bonito”. Vendemos números.</h2>
            <p className="mt-3 max-w-2xl text-sm text-[#14161A]/45">
              Rangos típicos en programas de recompra bien ejecutados en negocios locales. Tu resultado
              depende de ticket, frecuencia y seguimiento.
            </p>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
            {METRICS.map((m) => (
              <StaggerItem key={m.label}>
                <div className="rounded-[1.5rem] bg-white p-8 text-center ring-1 ring-[#14161A]/8">
                  <p className="text-5xl font-bold" style={{ color: BRONZE }}>
                    {m.value}
                  </p>
                  <p className="mt-3 text-lg font-semibold">{m.label}</p>
                  <p className="mt-1 text-xs text-[#14161A]/40">{m.note}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 10. PLAN */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Recuperando unos cuantos clientes al mes, el sistema puede pagarse solo.
            </h2>
            <p className="mt-4 max-w-2xl text-[#14161A]/55">
              No empieces por el precio. Empieza por cuánto dejas en la mesa cada vez que alguien no
              vuelve. Un solo plan, todo incluido.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div
              id="plan"
              className="relative mx-auto mt-10 max-w-lg rounded-[1.75rem] bg-white p-7 ring-1 ring-[#B8935A]/30 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">Plan único</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: BRONZE }}>
                $499
                <span className="ml-1 text-sm font-medium text-[#14161A]/40">MXN/mes</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#14161A]/70">
                {[
                  'Tarjetas ilimitadas',
                  'Sellos, puntos o cashback (el negocio elige)',
                  'Google Wallet + acceso PWA',
                  'WhatsApp automático por inactividad',
                  'Panel de clientes con semáforo de reactivación',
                  'Hasta 3 sucursales',
                  'Mensajes de cumpleaños automáticos',
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
                Quiero este plan
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
                Gana comisiones recurrentes por cada negocio que traigas — sin inversión de tu parte.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-[#14161A]/70">
                {[
                  'Sin cuota de entrada',
                  'Esquema de pago diseñado para que ganes más entre más vendas',
                  'Material de venta y demo listos desde el día uno',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <WaButton href={WA_SELLER} onClick={() => trackCta('vendedores')}>
                  Contáctanos para conocer el esquema completo
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
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#14161A]/45">
                  Tú presentas. El sistema trabaja. Si encaja, te lo explicamos al hablar.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 12. FAQ */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold sm:text-4xl">Objeciones, respondidas en claro</h2>
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
              Si contratas esto, la meta es una sola:{' '}
              <span style={{ color: BRONZE }}>vender más.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#14161A]/55">
              Mándanos tu logo. En 24h tienes el sistema listo para que tus clientes vuelvan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <WaButton href={WA_GROWTH} onClick={() => trackCta('cierre-ventas')}>
                Quiero aumentar mis ventas
              </WaButton>
              <WaButton href={WA_DEMO} onClick={() => trackCta('cierre-demo')}>
                Pedir demostración
              </WaButton>
            </div>
          </ScrollReveal>
        </section>

        {/* Ecosistema */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold sm:text-4xl">
              De la primera conversación a más clientes en la puerta
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#14161A]/50">
              Un solo sistema: captura, recompra, recuperación, NFC y reseñas trabajando juntos.
            </p>
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
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition hover:scale-105 active:scale-95"
        style={{ background: WA }}
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </main>
  );
}
