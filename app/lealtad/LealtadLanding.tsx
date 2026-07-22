'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import { GlowButton } from '@/components/landing/GlowButton';
import { ParticleField } from '@/components/landing/ParticleField';
import { ScrollReveal, StaggerItem, StaggerReveal } from '@/components/landing/ScrollReveal';
import { revealTransition } from '@/components/landing/motion';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';
import { RoiCalculator } from './RoiCalculator';

const CYAN = '#00D4FF';
const GOLD = '#FFD700';
const BG = '#0a0a0a';

const WA_GROWTH = agentiaWhatsAppUrl(
  'Hola Agentia, quiero aumentar mis ventas con el sistema de recompra. ¿Cómo arranco?',
);
const WA_DEMO = agentiaWhatsAppUrl(
  'Hola Agentia, quiero ver una demostración del sistema para mi negocio.',
);
const WA_BASIC = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan Básico ($299) para recuperar clientes y vender más.',
);
const WA_PRO = agentiaWhatsAppUrl(
  'Hola Agentia, me interesa el plan Pro ($499) para crecer más rápido con automatizaciones.',
);

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

const INDUSTRIES = [
  {
    id: 'cafe',
    label: 'Cafeterías',
    icon: '☕',
    example: 'Café #10 gratis → la rutina matutina se queda contigo.',
    color: 'from-[#4A2C1A] to-[#1A0E08]',
  },
  {
    id: 'barber',
    label: 'Barberías',
    icon: '✂️',
    example: 'Corte #10 por la casa + recordatorio a las 4 semanas.',
    color: 'from-[#1E293B] to-[#020617]',
  },
  {
    id: 'resto',
    label: 'Restaurantes',
    icon: '🍽️',
    example: 'Postre de la casa al volver — sin bajar el ticket con descuentos.',
    color: 'from-[#611F30] to-[#1a0a10]',
  },
  {
    id: 'spa',
    label: 'Estéticas',
    icon: '🌿',
    example: 'Sesión con puntos + WhatsApp cuando se pasa la cita.',
    color: 'from-[#064E3B] to-[#011611]',
  },
  {
    id: 'vet',
    label: 'Veterinarias',
    icon: '🐾',
    example: 'Vacunas y consultas que regresan a tiempo, no cuando duele.',
    color: 'from-[#1e3a5f] to-[#0b1220]',
  },
  {
    id: 'gym',
    label: 'Gimnasios',
    icon: '💪',
    example: 'Check-ins que empujan constancia y renuevan membresías.',
    color: 'from-[#3b1d4a] to-[#12081a]',
  },
  {
    id: 'boutique',
    label: 'Boutiques',
    icon: '👗',
    example: 'Cashback que trae la segunda compra sin liquidar margen.',
    color: 'from-[#4c1d3d] to-[#1a0a14]',
  },
  {
    id: 'farmacia',
    label: 'Farmacias',
    icon: '💊',
    example: 'Recompra de tratamientos recurrentes, no solo la urgencia.',
    color: 'from-[#134e4a] to-[#042f2e]',
  },
  {
    id: 'papel',
    label: 'Papelerías',
    icon: '📎',
    example: 'Sellos en temporada escolar y clientes que vuelven todo el año.',
    color: 'from-[#1e3a8a] to-[#0f172a]',
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
  'Captura WhatsApp',
  'Lealtad',
  'Automatizaciones',
  'Recuperación',
  'Tarjeta NFC',
  'Reseñas',
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
    a: 'Si recuperas unos cuantos clientes al mes con tu ticket promedio, el plan básico suele cubrirse solo. Usa el simulador de arriba con tus números reales.',
  },
  {
    q: '¿Sirve para mi giro?',
    a: 'Si vives de clientes que deberían volver (café, cortes, comida, estética, vet, gym, tienda local…), sí. Adaptamos sellos, puntos o cashback a cómo compra tu gente.',
  },
];

function PhoneHero() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const s3 = useRef<HTMLDivElement>(null);
  /** 0 = tarjeta fuera · 1 = en wallet · 2 = +1 visita · 3 = notificación */
  const [stage, setStage] = useState(reduceMotion ? 3 : 0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setStage(3);
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    const viewObs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    viewObs.observe(track);

    const stepObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const step = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isFinite(step)) continue;
          setStage((prev) => Math.max(prev, step));
        }
      },
      { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );

    for (const ref of [s1, s2, s3]) {
      if (ref.current) stepObs.observe(ref.current);
    }

    return () => {
      viewObs.disconnect();
      stepObs.disconnect();
    };
  }, [reduceMotion]);

  const visits = stage >= 2 ? 8 : 7;
  const remaining = 10 - visits;
  const cardIn = stage >= 1;
  const showNotif = stage >= 3;
  const progressPct = (visits / 10) * 100;

  return (
    <div ref={trackRef} className="relative mx-auto w-full max-w-[320px] lg:min-h-[118vh]">
      {/* Marcadores de scroll — Intersection Observer */}
      <div
        ref={s1}
        data-step={1}
        className="pointer-events-none absolute left-0 top-[18%] h-px w-px opacity-0"
        aria-hidden
      />
      <div
        ref={s2}
        data-step={2}
        className="pointer-events-none absolute left-0 top-[48%] h-px w-px opacity-0"
        aria-hidden
      />
      <div
        ref={s3}
        data-step={3}
        className="pointer-events-none absolute left-0 top-[78%] h-px w-px opacity-0"
        aria-hidden
      />

      <div className="lg:sticky lg:top-24">
        <div
          className="relative mx-auto w-full max-w-[300px]"
          style={{ transform: 'rotate(12deg)' }}
        >
          <div
            className="pointer-events-none absolute -inset-10 rounded-[3rem] opacity-60 blur-3xl"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${CYAN}40, transparent 55%), radial-gradient(circle at 80% 70%, ${GOLD}22, transparent 50%)`,
            }}
            aria-hidden
          />

          {/* Teléfono */}
          <div className="relative rounded-[2.15rem] border border-white/20 bg-[#0e0e0e] p-[10px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="relative overflow-hidden rounded-[1.65rem] bg-[#050505]">
              {/* Status */}
              <div className="relative z-20 flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-semibold text-white/70">
                <span>9:41</span>
                <div className="absolute left-1/2 top-2 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
                <span className="opacity-60">●●●</span>
              </div>

              <div className="relative z-10 px-4 pt-2">
                <p className="text-[11px] tracking-wide text-white/40">Google Wallet</p>
                <p className="font-[family-name:var(--font-space)] text-base font-bold text-white">
                  Pases
                </p>
              </div>

              {/* Notificación push */}
              <div
                className={`relative z-30 mx-3 mt-2 overflow-hidden transition-all duration-500 ease-out ${
                  showNotif
                    ? 'max-h-24 translate-y-0 opacity-100'
                    : 'max-h-0 -translate-y-2 opacity-0'
                }`}
                style={{
                  transitionProperty: reduceMotion ? 'none' : 'opacity, transform, max-height',
                }}
              >
                <div className="rounded-2xl border border-white/15 bg-[#1c1c1e]/95 px-3 py-2.5 shadow-lg backdrop-blur-md">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/20 text-sm">
                      🎉
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-white/50">Café Luna</p>
                      <p className="text-[12px] font-medium leading-snug text-white">
                        🎉 ¡Felicidades! Has desbloqueado tu recompensa
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet slot + tarjeta */}
              <div className="relative z-10 mt-2 min-h-[280px] overflow-hidden px-3 pb-5">
                <div
                  className="absolute inset-x-3 top-0 h-8 rounded-t-xl border border-b-0 border-white/10 bg-gradient-to-b from-white/10 to-transparent"
                  aria-hidden
                />

                <div
                  className="relative pt-3 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{
                    transitionProperty: reduceMotion ? 'none' : 'transform',
                    transform: reduceMotion || cardIn ? 'translateY(0)' : 'translateY(62%)',
                  }}
                >
                  {/* Tarjeta negra mate + chrome */}
                  <div
                    className="relative overflow-hidden rounded-2xl p-px"
                    style={{
                      background:
                        'linear-gradient(135deg, #e8e8e8 0%, #6a6a6a 28%, #f2f2f2 48%, #3a3a3a 72%, #c8c8c8 100%)',
                      boxShadow:
                        '0 20px 40px -18px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-[15px] px-4 py-4"
                      style={{
                        background:
                          'linear-gradient(160deg, #2a2a2a 0%, #121212 42%, #0a0a0a 100%)',
                      }}
                    >
                      {/* Glare — solo si visible y motion OK */}
                      {!reduceMotion ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[2]"
                          style={{
                            background:
                              'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.09) 48%, transparent 62%)',
                            backgroundSize: '220% 100%',
                            animation: inView
                              ? 'lealtadHeroGlare 9s ease-in-out infinite'
                              : 'none',
                            animationPlayState: inView ? 'running' : 'paused',
                          }}
                          aria-hidden
                        />
                      ) : null}

                      <div className="relative z-[3]">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F5F0E8] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_0_0_1px_rgba(255,255,255,0.12)]">
                            <Image
                              src="/images/mockups/cafe-luna-logo.jpg"
                              alt="Café Luna"
                              width={56}
                              height={56}
                              className="h-[118%] w-[118%] max-w-none object-cover object-center"
                              style={{ imageRendering: 'auto' }}
                              quality={95}
                              priority
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-[family-name:var(--font-space)] text-lg font-bold leading-tight text-white">
                              Café Luna
                            </p>
                            <p className="text-[12px] text-white/55">Sofía Reyes</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-white/45">
                              {visits} de 10 visitas
                            </span>
                            <span className="text-white/35">
                              {remaining === 1
                                ? 'Te falta 1 visita'
                                : `Te faltan ${remaining} visitas`}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full transition-[width] duration-700 ease-out"
                              style={{
                                width: `${progressPct}%`,
                                background: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
                                transitionProperty: reduceMotion ? 'none' : 'width',
                                boxShadow: `0 0 12px ${CYAN}55`,
                              }}
                            />
                          </div>
                          <p className="mt-2 text-[12px] text-white/50">
                            {stage >= 2
                              ? 'Te falta 1 visita para tu recompensa'
                              : 'Te faltan 2 visitas para tu recompensa'}
                          </p>
                        </div>

                        <div
                          className="mt-4 rounded-xl border border-white/10 px-3 py-2.5"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(0,212,255,0.08))',
                          }}
                        >
                          <p className="font-[family-name:var(--font-space)] text-sm font-semibold text-white">
                            🎁 Café gratis
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/45">
                            Recompensa al completar 10 visitas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="relative z-10 pb-4 text-center text-[10px] text-white/30">
                Apple Wallet · <span className="text-white/20">próximamente</span>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-white/40 lg:mt-10">
          Haz scroll — la tarjeta entra al Wallet, suma visita y desbloquea la recompensa.
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes lealtadHeroGlare{0%{background-position:120% 0}100%{background-position:-40% 0}}`,
        }}
      />
    </div>
  );
}

function NfcCardMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto flex h-[280px] w-full max-w-[340px] items-center justify-center [perspective:900px]">
      <div
        className="pointer-events-none absolute inset-8 rounded-full opacity-60 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${CYAN}33, transparent 65%)`,
        }}
        aria-hidden
      />
      <motion.div
        className="relative h-[168px] w-[268px]"
        style={{ transformStyle: 'preserve-3d' }}
        initial={reduceMotion ? false : { rotateY: -18, rotateX: 8, y: 12 }}
        animate={reduceMotion ? undefined : { rotateY: [-16, -10, -16], rotateX: [8, 6, 8], y: [8, 0, 8] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-white/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.75)]"
          style={{
            background:
              'linear-gradient(145deg, #1a1f2a 0%, #0c1018 45%, #151a24 100%)',
            transform: 'translateZ(12px)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 38%), radial-gradient(circle at 85% 15%, rgba(0,212,255,.2), transparent 40%)',
            }}
            aria-hidden
          />
          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-[family-name:var(--font-space)] text-[10px] uppercase tracking-[0.16em] text-[#00D4FF]">
                  Agentia
                </p>
                <p className="mt-1 font-[family-name:var(--font-space)] text-lg font-bold text-white">
                  Tarjeta Inteligente
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 4c-2.2 2.4-3.5 5-3.5 8S9.8 17.6 12 20c2.2-2.4 3.5-5 3.5-8S14.2 6.4 12 4Z"
                    stroke={CYAN}
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="1.6" fill={CYAN} />
                </svg>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">NFC · un toque</p>
                <p className="mt-0.5 text-xs text-white/65">Reviews · WhatsApp · Menú · más</p>
              </div>
              <div
                className="h-8 w-11 rounded-md border border-white/15"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 1px, transparent 1px 3px)',
                }}
                aria-hidden
              />
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 -z-10 rounded-2xl bg-black/50 blur-md"
          style={{ transform: 'translateY(18px) rotateX(70deg) scale(0.92)' }}
          aria-hidden
        />
      </motion.div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-[family-name:var(--font-space)] text-[15px] font-semibold text-white sm:text-base">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
            <p className="pb-5 pr-8 text-sm leading-relaxed text-white/55">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LealtadLanding() {
  const reduceMotion = useReducedMotion();
  const [industry, setIndustry] = useState(INDUSTRIES[0]);

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-jakarta)] text-white"
      style={{ background: BG }}
    >
      <ParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-45"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 15% -5%, rgba(0,212,255,0.12), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 10%, rgba(255,215,0,0.08), transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        {/* Nav */}
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
              <span className="ml-1.5 text-[#00D4FF]">Crecimiento</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/55 md:flex">
            <a href="#simulador" className="hover:text-[#00D4FF]">
              Simulador
            </a>
            <a href="#giros" className="hover:text-[#00D4FF]">
              Tu giro
            </a>
            <a href="#planes" className="hover:text-[#00D4FF]">
              Planes
            </a>
          </nav>
          <GlowButton href={WA_GROWTH} external>
            Quiero vender más
          </GlowButton>
        </header>

        {/* 1. HERO */}
        <section className="grid items-center gap-12 py-14 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-2 lg:gap-10 lg:py-10">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0, 0.35)}
              className="mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Para negocios locales que viven de clientes que vuelven
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.06, 0.45)}
              className="font-[family-name:var(--font-space)] text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.85rem]"
            >
              Haz que tus clientes{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                regresen una y otra vez.
              </span>
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.12, 0.4)}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
            >
              Convierte visitas ocasionales en clientes frecuentes. El sistema acumula recompensas,
              detecta quién se enfría y los trae de vuelta — casi solo.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.18, 0.35)}
              className="mt-8 flex flex-wrap gap-3"
            >
              <GlowButton href={WA_GROWTH} external>
                Quiero aumentar mis ventas
              </GlowButton>
              <GlowButton href="#demo" variant="secondary">
                Ver demostración
              </GlowButton>
            </motion.div>
            <motion.ul
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={revealTransition(0.28, 0.4)}
              className="mt-8 grid gap-2 sm:grid-cols-2"
            >
              {BADGES.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-white/55">
                  <Check className="h-4 w-4 shrink-0 text-[#00D4FF]" />
                  {b}
                </li>
              ))}
            </motion.ul>
          </div>
          <div id="demo">
            <PhoneHero />
          </div>
        </section>

        {/* 2. PROBLEMA */}
        <section className="py-20 sm:py-24">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              El costo invisible
            </p>
            <h2 className="max-w-3xl font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto dinero estás perdiendo cada mes?
            </h2>
            <p className="mt-4 max-w-2xl text-white/55">
              Traer un cliente nuevo es caro. Dejar ir a uno que ya te conoce es más caro todavía —
              porque ya invertiste en que te encontrara.
            </p>
          </ScrollReveal>
          <StaggerReveal className="mt-12 grid gap-4 md:grid-cols-3">
            {PROBLEM_STATS.map((s) => (
              <StaggerItem key={s.value}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/30">
                  <p
                    className="font-[family-name:var(--font-space)] text-4xl font-extrabold"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 3. ANTES VS DESPUÉS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Antes vs después
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Del “gracias, adiós” al cliente que vuelve solo
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-7 opacity-90">
                <p className="font-mono text-xs uppercase tracking-wider text-[#FF6B5E]">Antes</p>
                <ul className="mt-6 space-y-4">
                  {['Cliente compra', 'Se va', 'Nunca vuelve', 'Tú pagas otra vez por atraer a alguien nuevo'].map(
                    (t, i) => (
                      <li key={t} className="flex items-center gap-3 text-white/50">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 font-mono text-xs text-white/30">
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
              <div className="h-full rounded-3xl border border-[#00D4FF]/35 bg-[#00D4FF]/[0.04] p-7 shadow-[0_0_40px_rgba(0,212,255,0.08)]">
                <p className="font-mono text-xs uppercase tracking-wider text-[#00D4FF]">Después</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {AFTER_STEPS.map((t, i) => (
                    <motion.span
                      key={t}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/85"
                    >
                      <span className="font-mono text-[10px] text-[#00D4FF]">{i + 1}</span>
                      {t}
                      {i < AFTER_STEPS.length - 1 ? (
                        <ArrowRight className="hidden h-3 w-3 text-white/25 sm:inline" />
                      ) : null}
                    </motion.span>
                  ))}
                </div>
                <p className="mt-6 text-sm text-white/55">
                  Menos publicidad. Más recompra. El crecimiento viene de la gente que ya te eligió.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 4. SIMULADOR */}
        <section id="simulador" className="py-20 sm:py-24">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              Simulador de ganancias
            </p>
            <h2 className="max-w-3xl font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
              ¿Cuánto podrías ganar si solo un poco más de gente volviera?
            </h2>
            <p className="mt-4 max-w-2xl text-white/55">
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
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Lo que ganas
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              No es software. Es crecimiento en automático.
            </h2>
          </ScrollReveal>
          <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/30">
                  <b.icon className="h-5 w-5 text-[#00D4FF]" />
                  <h3 className="mt-4 font-[family-name:var(--font-space)] text-lg font-bold leading-snug">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 6. INDUSTRIAS */}
        <section id="giros" className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Tu giro
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Hecho para el negocio de la esquina — y el que quiere crecer
            </h2>
          </ScrollReveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setIndustry(ind)}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-150 active:scale-[0.97] ${
                  industry.id === ind.id
                    ? 'border-[#00D4FF] bg-[#00D4FF]/12 text-[#00D4FF]'
                    : 'border-white/12 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
                }`}
              >
                {ind.icon} {ind.label}
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
              className={`mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${industry.color} p-8 sm:p-10`}
            >
              <p className="text-4xl">{industry.icon}</p>
              <h3 className="mt-4 font-[family-name:var(--font-space)] text-2xl font-bold">
                {industry.label}
              </h3>
              <p className="mt-3 max-w-xl text-base text-white/75">{industry.example}</p>
              <a
                href={agentiaWhatsAppUrl(
                  `Hola Agentia, tengo un negocio de ${industry.label.toLowerCase()} y quiero más clientes frecuentes.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:text-[#FFD700]"
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
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              Automatizaciones
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Un empleado que recupera clientes mientras tú atiendes
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              No tienes que acordarte de quién falta. El sistema lo hace por ti.
            </p>
          </ScrollReveal>
          <div className="relative mt-12">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-[#00D4FF]/50 via-white/15 to-transparent sm:left-[19px]" />
            <ul className="space-y-6">
              {AUTOMATIONS.map((a, i) => (
                <ScrollReveal key={a.t} delay={i * 0.04}>
                  <li className="relative flex gap-5 pl-1">
                    <span className="relative z-[1] mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00D4FF]/40 bg-[#0a0a0a] font-mono text-[11px] text-[#00D4FF] sm:h-10 sm:w-10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                      <h3 className="font-[family-name:var(--font-space)] text-lg font-bold">
                        {a.t}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">{a.d}</p>
                    </div>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </section>

        {/* NFC — upsell físico */}
        <section className="py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
                Upsell opcional
              </p>
              <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
                Convierte clientes satisfechos en promotores de tu negocio
              </h2>
              <p className="mt-4 text-white/55">
                La Tarjeta Inteligente NFC es un complemento físico: el cliente acerca el teléfono y
                se abre exactamente lo que tú configuraste — sin apps nuevas ni explicar códigos.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {NFC_ACTIONS.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-white/40">
                Ideal en mostrador, mesa o paquete: un toque y el cliente ya está en Reviews,
                WhatsApp o tu programa de lealtad.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <NfcCardMockup />
            </ScrollReveal>
          </div>
        </section>

        {/* Reseñas Google */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Reputación
            </p>
            <h2 className="max-w-3xl font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
              Consigue más reseñas de Google sin pedir códigos QR
            </h2>
            <p className="mt-4 max-w-2xl text-white/55">
              El cliente termina, acerca el teléfono o abre su pase, califica y recibe recompensa.
              Tú no persigues a nadie con un papelito.
            </p>
          </ScrollReveal>

          <StaggerReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_STEPS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/30">
                  <span className="font-mono text-xs text-[#00D4FF]">{s.n}</span>
                  <h3 className="mt-3 font-[family-name:var(--font-space)] text-base font-bold leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-3xl border border-[#25D366]/30 bg-[#25D366]/[0.06] p-6">
                <div className="flex items-center gap-2 text-[#25D366]">
                  <Star className="h-4 w-4 fill-[#25D366]" />
                  <span className="font-[family-name:var(--font-space)] text-sm font-semibold">
                    4–5 estrellas
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Lo mandamos directo a Google Reviews. Publicas lo que suma reputación y
                  posicionamiento.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2 text-[#FFD700]">
                  <Shield className="h-4 w-4" />
                  <span className="font-[family-name:var(--font-space)] text-sm font-semibold">
                    Menos de 4 estrellas
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Se guarda en un formulario interno. Tú ves el feedback y puedes recuperarlo —
                  sin que dañe tu reputación pública en Maps.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <StaggerReveal className="mt-8 grid gap-4 md:grid-cols-3">
            {REVIEW_METRICS.map((m) => (
              <StaggerItem key={m.value}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p
                    className="font-[family-name:var(--font-space)] text-lg font-bold"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {m.value}
                  </p>
                  <p className="mt-2 text-sm text-white/50">{m.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 8. COMPARATIVA */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Comparativa
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Tarjeta de papel vs Agentia
            </h2>
          </ScrollReveal>
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-2 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-wider sm:px-6 sm:text-sm">
              <span className="text-[#FF6B5E]/90">Tarjeta de papel</span>
              <span className="text-[#00D4FF]">Agentia</span>
            </div>
            {COMPARE.map((row) => (
              <div
                key={row.paper}
                className="grid grid-cols-1 gap-3 border-t border-white/10 px-4 py-4 sm:grid-cols-2 sm:gap-6 sm:px-6"
              >
                <p className="text-sm text-white/45 line-through decoration-white/20">{row.paper}</p>
                <p className="text-sm font-medium text-white/90">{row.agentia}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. MÉTRICAS */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              Resultados que importan
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              No vendemos “bonito”. Vendemos números.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/45">
              Rangos típicos en programas de recompra bien ejecutados en negocios locales. Tu
              resultado depende de ticket, frecuencia y seguimiento.
            </p>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
            {METRICS.map((m) => (
              <StaggerItem key={m.label}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <p
                    className="font-[family-name:var(--font-space)] text-5xl font-extrabold"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {m.value}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-space)] text-lg font-semibold">
                    {m.label}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{m.note}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* 10. PLANES + ROI */}
        <section id="planes" className="py-20 sm:py-24">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Inversión
            </p>
            <h2 className="max-w-3xl font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
              Recuperando unos cuantos clientes al mes, el sistema puede pagarse solo.
            </h2>
            <p className="mt-4 max-w-2xl text-white/55">
              No empieces por el precio. Empieza por cuánto dejas en la mesa cada vez que alguien no
              vuelve. Después elige el plan.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ScrollReveal>
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="font-mono text-xs uppercase tracking-wider text-white/40">Básico</p>
                <p className="mt-2 font-[family-name:var(--font-space)] text-4xl font-bold">
                  $299
                  <span className="ml-1 text-sm font-medium text-white/40">MXN/mes</span>
                </p>
                <p className="mt-1 text-sm text-white/45">Un local · empezar a recuperar</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                  {[
                    'Clientes que vuelven con recompensas claras',
                    'Check-in con QR (sin apps nuevas)',
                    'WhatsApp cuando alguien se enfría',
                    'Panel: activos / en riesgo / perdidos',
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
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3.5 text-sm font-bold transition hover:-translate-y-px hover:border-[#00D4FF]/50 active:scale-[0.97]"
                >
                  Quiero el Básico
                </a>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="relative flex h-full flex-col rounded-3xl border border-[#00D4FF]/40 bg-white/[0.04] p-7 shadow-[0_0_40px_rgba(0,212,255,0.1)]">
                <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#FFD700] px-3 py-1 text-[11px] font-bold text-[#0a0a0a]">
                  Más crecimiento
                </span>
                <p className="font-mono text-xs uppercase tracking-wider text-white/40">Pro</p>
                <p className="mt-2 font-[family-name:var(--font-space)] text-4xl font-bold">
                  $499
                  <span className="ml-1 text-sm font-medium text-white/40">MXN/mes</span>
                </p>
                <p className="mt-1 text-sm text-white/45">Hasta 3 sucursales · más automatización</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                  {[
                    'Todo lo del Básico',
                    'Cumpleaños y promos a segmentos',
                    'Más locales bajo el mismo sistema',
                    'Exportar tu base para seguir creciendo',
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
                  className="mt-5 inline-flex items-center justify-center rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a] shadow-[0_0_32px_rgba(0,212,255,0.35)] transition hover:-translate-y-px active:scale-[0.97]"
                  style={{ background: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
                >
                  Quiero el Pro
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 11. FAQ */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              Preguntas
            </p>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              Objeciones, respondidas en claro
            </h2>
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
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-space)] text-3xl font-bold leading-tight sm:text-4xl">
              Si contratas esto, la meta es una sola:{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                vender más.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/55">
              Mándanos tu logo. En 24h tienes el sistema listo para que tus clientes vuelvan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <GlowButton href={WA_GROWTH} external>
                Quiero aumentar mis ventas
              </GlowButton>
              <GlowButton href={WA_DEMO} external variant="secondary">
                Pedir demostración
              </GlowButton>
            </div>
          </ScrollReveal>
        </section>

        {/* Ecosistema — diagrama visual */}
        <section className="py-16 sm:py-20">
          <ScrollReveal>
            <p className="mb-3 text-center font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#00D4FF]">
              El ecosistema
            </p>
            <h2 className="mx-auto max-w-2xl text-center font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
              De la primera conversación a más clientes en la puerta
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/50">
              Un solo sistema: captura, recompra, recuperación, NFC y reseñas trabajando juntos.
            </p>
          </ScrollReveal>
          <div className="mt-10 overflow-x-auto pb-2">
            <div className="mx-auto flex min-w-[640px] max-w-4xl flex-wrap items-center justify-center gap-2 sm:min-w-0">
              {ECOSYSTEM.map((node, i) => (
                <div key={node} className="flex items-center gap-2">
                  <div
                    className={`rounded-2xl border px-3.5 py-2.5 text-center text-xs font-semibold sm:text-sm ${
                      i === ECOSYSTEM.length - 1
                        ? 'border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#00D4FF]'
                        : 'border-white/12 bg-white/[0.04] text-white/75'
                    }`}
                  >
                    {node}
                  </div>
                  {i < ECOSYSTEM.length - 1 ? (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
          <Link href="/" className="text-white/60 hover:text-[#00D4FF]">
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
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#06130B] shadow-[0_8px_32px_rgba(37,211,102,0.45)] transition hover:scale-105 active:scale-95"
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </main>
  );
}
