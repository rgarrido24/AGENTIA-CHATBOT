'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { DemoPreview, type DemoPreviewProps } from '@/components/DemoPreview';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 2000,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('es-MX')}{suffix}
    </span>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: 120,   prefix: '+',  suffix: '',  label: 'Negocios automatizados' },
  { value: 10,    prefix: '+',  suffix: '',  label: 'Industrias atendidas' },
  { value: 98,    prefix: '',   suffix: '%', label: 'Satisfacción de clientes' },
  { value: 45000, prefix: '+',  suffix: '',  label: 'Chats procesados' },
];

const HERO_DEMO_CHIPS = ['✂️ Barbería', '🍔 Restaurante', '🦷 Dental', '🔧 Taller', '🥗 Nutrición', '💆 Spa'];

type PortfolioEntry = {
  href: string;
  external?: boolean;
  title: string;
  emoji: string;
  description: string;
  chips: string[];
  preview: DemoPreviewProps;
  cardClass: string;
  hoverClass: string;
  ctaClass: string;
};

const PORTFOLIO: PortfolioEntry[] = [
  {
    href: '/demo/barber',
    title: 'Barbería',
    emoji: '✂️',
    description: 'Agenda con IA que detecta conflictos de horario en tiempo real y ofrece alternativas automáticas.',
    chips: ['✂️ Agenda', '⚡ Conflictos', '👥 Clientes', '🔔 Recordatorios'],
    preview: {
      accentColor: '#0d9488',
      stats: [
        { label: 'Citas hoy', value: '8' },
        { label: 'Ingresos', value: '$1,240' },
      ],
      chatMessages: [
        { role: 'user', text: 'Quiero cita mañana' },
        { role: 'bot', text: 'Ese horario está ocupado ⚠️ ¿Te acomoda a las 11am?' },
      ],
      hasChart: true,
    },
    cardClass: 'rgba(13,148,136,0.07)',
    hoverClass: 'hover:border-teal-500/60 hover:shadow-[0_0_48px_rgba(13,148,136,0.2)]',
    ctaClass: 'text-teal-300',
  },
  {
    href: '/demo/cobranza',
    title: 'Cobranza & Cartera',
    emoji: '📊',
    description:
      'Dashboard de morosidad, secuencias automáticas, estado de cuenta PDF y score de riesgo con IA para instituciones y empresas.',
    chips: ['📊 Score IA', '🧾 PDF', '🤖 Secuencias', '💬 WhatsApp'],
    preview: {
      accentColor: '#1e40af',
      stats: [
        { label: 'Cartera', value: '$284K' },
        { label: 'Adeudo', value: '23%' },
      ],
      chatMessages: [
        { role: 'user', text: '¿Cuánto debo?' },
        { role: 'bot', text: 'Tu adeudo es $3,200 MXN 📋 ¿Quieres un plan de pagos?' },
      ],
      hasChart: true,
    },
    cardClass: 'rgba(30,64,175,0.12)',
    hoverClass: 'hover:border-blue-500/70 hover:shadow-[0_0_48px_rgba(30,64,175,0.25)]',
    ctaClass: 'text-blue-300',
  },
  {
    href: 'https://inmobiliaria-agentia.vercel.app/',
    external: true,
    title: 'Inmobiliaria IA',
    emoji: '🏠',
    description:
      'Portal de propiedades con IA, calificación de leads automática, análisis de plusvalía y ROI por propiedad.',
    chips: ['🏠 Portal', '📈 ROI', '🤖 Leads IA', '📍 Mapa'],
    preview: {
      accentColor: '#059669',
      stats: [
        { label: 'Propiedades', value: '48' },
        { label: 'Leads hoy', value: '12' },
      ],
      chatMessages: [
        { role: 'user', text: 'Busco casa 3 recámaras' },
        { role: 'bot', text: 'Encontré 8 opciones 🏠 ¿Cuál es tu presupuesto?' },
      ],
      hasChart: false,
    },
    cardClass: 'rgba(5,150,105,0.1)',
    hoverClass: 'hover:border-emerald-500/65 hover:shadow-[0_0_48px_rgba(5,150,105,0.2)]',
    ctaClass: 'text-emerald-300',
  },
  {
    href: '/demo/restaurante',
    title: 'Restaurantes',
    emoji: '🍔',
    description:
      'Sistema completo para bar-restaurante: menú QR, panel de cocina, delivery con CRM, inventario y caja con IA.',
    chips: ['📱 Menú QR', '🍳 Cocina', '🛵 Delivery', '🤖 Chat IA'],
    preview: {
      accentColor: '#dc2626',
      stats: [
        { label: 'Ventas hoy', value: '$4,200' },
        { label: 'Órdenes', value: '18' },
      ],
      chatMessages: [
        { role: 'user', text: 'Quiero 2 alitas y un mojito' },
        { role: 'bot', text: '¡Perfecto! 🍔 ¿Es para mesa o delivery?' },
      ],
      hasChart: true,
    },
    cardClass: 'rgba(220,38,38,0.1)',
    hoverClass: 'hover:border-red-400/65 hover:shadow-[0_0_48px_rgba(220,38,38,0.22)]',
    ctaClass: 'text-red-300',
  },
  {
    href: '/demo/spa',
    title: 'Spa & Estética',
    emoji: '💆',
    description: 'Agenda semanal, clientes VIP, servicios y recordatorios; dashboard con KPIs y chat IA para recepción.',
    chips: ['📅 Agenda', '💜 KPIs', '✨ Servicios', '🤖 Chat IA'],
    preview: {
      accentColor: '#9333ea',
      stats: [
        { label: 'Citas hoy', value: '12' },
        { label: 'VIP activas', value: '5' },
      ],
      chatMessages: [
        { role: 'user', text: 'Masaje el martes a las 3pm' },
        { role: 'bot', text: 'Carmen está ocupada 💜 ¿Te acomoda Ana a las 4pm?' },
      ],
      hasChart: false,
    },
    cardClass: 'rgba(147,51,234,0.1)',
    hoverClass: 'hover:border-fuchsia-500/55 hover:shadow-[0_0_48px_rgba(147,51,234,0.22)]',
    ctaClass: 'text-fuchsia-300',
  },
  {
    href: '/demo/grooming',
    title: 'Grooming Canino',
    emoji: '🐾',
    description: 'Fichas de mascotas, agenda, servicio a domicilio con seguimiento y recordatorios inteligentes.',
    chips: ['🐾 Fichas', '📅 Agenda', '🚐 Domicilio', '🤖 Chat IA'],
    preview: {
      accentColor: '#f97316',
      stats: [
        { label: 'Citas hoy', value: '9' },
        { label: 'Domicilios', value: '3' },
      ],
      chatMessages: [
        { role: 'user', text: 'Baño para mi golden en Iztapalapa' },
        { role: 'bot', text: 'Fuera de zona 🐾 ¿Lo traes a sucursal con 15% off?' },
      ],
      hasChart: false,
    },
    cardClass: 'rgba(249,115,22,0.1)',
    hoverClass: 'hover:border-orange-400/75 hover:shadow-[0_0_48px_rgba(249,115,22,0.22)]',
    ctaClass: 'text-orange-300',
  },
  {
    href: '/demo/dentista',
    title: 'Clínica Dental',
    emoji: '🦷',
    description: 'Expediente clínico con odontograma, recetas PDF, agenda por dentista y cobranza.',
    chips: ['🦷 Expediente', '💊 Recetas PDF', '📅 Agenda', '💰 Pagos'],
    preview: {
      accentColor: '#0284c7',
      stats: [
        { label: 'Pacientes', value: '20' },
        { label: 'Por cobrar', value: '$8,400' },
      ],
      chatMessages: [
        { role: 'user', text: 'Receto Amoxicilina a María López' },
        { role: 'bot', text: '⚠️ ALERGIA: María es alérgica a Penicilina. Sugiero Azitromicina.' },
      ],
      hasChart: false,
    },
    cardClass: 'rgba(2,132,199,0.1)',
    hoverClass: 'hover:border-sky-400/75 hover:shadow-[0_0_48px_rgba(2,132,199,0.22)]',
    ctaClass: 'text-sky-300',
  },
  {
    href: '/demo/medico',
    title: 'Médico & Especialistas',
    emoji: '👨‍⚕️',
    description:
      'Expediente clínico digital, agenda por especialidad, recetas con QR verificable, signos vitales y recordatorios automáticos.',
    chips: ['📋 Expediente', '📈 Signos vitales', '💊 Recetas+Incapacidad', '🤖 IA'],
    preview: {
      accentColor: '#16a34a',
      stats: [
        { label: 'Consultas hoy', value: '6' },
        { label: 'En espera', value: '2' },
      ],
      chatMessages: [
        { role: 'user', text: 'Cita con ginecología urgente' },
        { role: 'bot', text: 'Agenda llena 3 semanas 📋 ¿Te anoto en lista de espera?' },
      ],
      hasChart: false,
    },
    cardClass: 'rgba(22,163,74,0.1)',
    hoverClass: 'hover:border-green-400/65 hover:shadow-[0_0_48px_rgba(22,163,74,0.22)]',
    ctaClass: 'text-green-300',
  },
  {
    href: '/demo/taller',
    title: 'Taller Mecánico',
    emoji: '🔧',
    description:
      'Órdenes tipo taller, historial por vehículo, presupuestos PDF, inventario de refacciones, caja y recordatorios de mantenimiento con IA.',
    chips: ['🔧 Órdenes', '📄 Presupuesto PDF', '🔔 Recordatorios', '🤖 IA'],
    preview: {
      accentColor: '#475569',
      stats: [
        { label: 'En taller', value: '7' },
        { label: 'Listos', value: '2' },
      ],
      chatMessages: [
        { role: 'user', text: '¿Ya está mi Honda Civic?' },
        { role: 'bot', text: 'Listo ✅ + encontramos frenos al 15% ¿Los cambiamos?' },
      ],
      hasChart: true,
    },
    cardClass: 'rgba(71,85,105,0.12)',
    hoverClass: 'hover:border-slate-500/75 hover:shadow-[0_0_48px_rgba(71,85,105,0.25)]',
    ctaClass: 'text-slate-300',
  },
  {
    href: '/demo/nutricion',
    title: 'Nutrición & Bienestar',
    emoji: '🥗',
    description:
      'Seguimiento nutricional con IA. Tablero de progreso, OCR de báscula InBody, recordatorios motivacionales y asistente que conoce la dieta de cada paciente.',
    chips: ['📊 Tablero', '🤖 IA Dietética', '📷 OCR InBody', '💬 WhatsApp'],
    preview: {
      accentColor: '#16a34a',
      stats: [
        { label: 'Pacientes', value: '20' },
        { label: 'Bajaron kg', value: '4.2' },
      ],
      chatMessages: [
        { role: 'user', text: '¿Puedo comer pizza?' },
        { role: 'bot', text: '🚫 No está en tu plan. ¿Te sugiero 3 opciones similares?' },
      ],
      hasChart: true,
    },
    cardClass: 'rgba(22,163,74,0.1)',
    hoverClass: 'hover:border-emerald-400/65 hover:shadow-[0_0_48px_rgba(22,163,74,0.22)]',
    ctaClass: 'text-emerald-300',
  },
];

const TESTIMONIOS = [
  {
    nombre: 'Roberto M.',
    cargo: 'Dueño',
    negocio: 'Barbería El Estilo',
    ciudad: 'CDMX',
    texto: 'Desde que implementamos el chatbot dejamos de perder citas por llamadas no contestadas. Nuestros clientes agendan a las 2am si quieren. Las reservas aumentaron un 40% el primer mes.',
    fecha: 'Hace 3 meses',
    color: '#0d9488',
  },
  {
    nombre: 'Dra. Patricia S.',
    cargo: 'Dentista',
    negocio: 'Consultorio Dental',
    ciudad: 'Guadalajara',
    texto: 'El expediente digital y las recetas con QR le dan una imagen muy profesional a mi consultorio. Mis pacientes se sorprenden cuando les mando su receta verificable al instante.',
    fecha: 'Hace 5 meses',
    color: '#0ea5e9',
  },
  {
    nombre: 'Carlos Mendoza',
    cargo: 'Gerente',
    negocio: 'Distribuidora NorTech',
    ciudad: 'Monterrey',
    texto: 'La recuperación de cartera mejoró notablemente. El sistema detecta automáticamente quién debe y genera los mensajes. Antes tardábamos días en hacer eso manualmente.',
    fecha: 'Hace 2 meses',
    color: '#3b82f6',
  },
  {
    nombre: 'Valeria R.',
    cargo: 'Directora',
    negocio: 'Lumina Spa',
    ciudad: 'Mérida',
    texto: 'Los recordatorios automáticos redujeron nuestros no-shows en un 60%. El chatbot responde a cualquier hora y agenda citas mientras yo duermo. Vale cada peso.',
    fecha: 'Hace 1 mes',
    color: '#9333ea',
  },
  {
    nombre: 'Chef Marcos I.',
    cargo: 'Chef / Dueño',
    negocio: 'La Séptima Bar & Kitchen',
    ciudad: 'Puebla',
    texto: 'El panel de cocina eliminó los tickets en papel. Las órdenes llegan directo a la pantalla. Cero errores, cero confusiones. El delivery con seguimiento le encantó a nuestros clientes.',
    fecha: 'Hace 4 meses',
    color: '#ef4444',
  },
  {
    nombre: 'Ing. Luis Torres',
    cargo: 'Dueño',
    negocio: 'Taller AutoPro',
    ciudad: 'León, Gto.',
    texto: 'Los presupuestos en PDF profesional cerraron más ventas. Los clientes confían más cuando ven un documento formal. El recordatorio de mantenimiento trae clientes de regreso solos.',
    fecha: 'Hace 6 meses',
    color: '#f97316',
  },
];

const INDUSTRIAS = [
  { emoji: '🍔', label: 'Restaurantes & Bares' },
  { emoji: '💆', label: 'Spas & Estéticas' },
  { emoji: '🦷', label: 'Clínicas Dentales' },
  { emoji: '👨‍⚕️', label: 'Consultorios Médicos' },
  { emoji: '✂️', label: 'Barberías' },
  { emoji: '🐾', label: 'Grooming Canino' },
  { emoji: '🔧', label: 'Talleres Mecánicos' },
  { emoji: '📊', label: 'Cobranza & Finanzas' },
  { emoji: '🏠', label: 'Inmobiliarias' },
  { emoji: '🎓', label: 'Instituciones Educativas' },
];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 55%, #1e293b 100%)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Ambient glows */}
      <div
        className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">

          {/* ── Header / Logo ───────────────────────────────────────────── */}
          <header className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-1 animate-glow-pulse"
                style={{ boxShadow: '0 0 20px rgba(13,148,136,0.3)' }}
              >
                <Image
                  src="/logo-agentia-2026.png"
                  alt="Agentia"
                  width={56}
                  height={56}
                  className="rounded-lg object-contain w-14 h-14"
                />
              </div>
              <span className="text-xl font-bold tracking-wide text-white hidden sm:block">Agentia</span>
            </div>
            <Link
              href="/login?from=/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(13,148,136,0.12)',
                border: '1px solid rgba(13,148,136,0.35)',
                color: '#5eead4',
              }}
            >
              Acceso Clientes
            </Link>
          </header>

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <section className="mb-20">
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
              style={{
                background: 'rgba(13,148,136,0.1)',
                border: '1px solid rgba(13,148,136,0.25)',
                color: '#5eead4',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Impulsado por Gemini 2.5 Flash
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
              Automatización inteligente
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #5eead4, #0d9488, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                para tu negocio
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mb-6 leading-relaxed">
              Chatbots con IA, CRM integrado y flujos de venta automatizados.
              Atención 24/7 sin aumentar tu equipo.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {HERO_DEMO_CHIPS.map((demo) => (
                <span
                  key={demo}
                  className="animate-pulse rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
                >
                  {demo}
                </span>
              ))}
            </div>
            <Link
              href="/login?from=/dashboard"
              className="mt-10 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all duration-300 btn-cta"
            >
              Acceso Clientes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

          {/* ── BLOQUE A — ESTADÍSTICAS ANIMADAS ────────────────────────── */}
          <section className="mb-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-xl p-6 text-center"
                  style={{
                    background: 'rgba(13,148,136,0.07)',
                    border: '1px solid rgba(13,148,136,0.2)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p
                    className="text-3xl sm:text-4xl font-extrabold tabular-nums mb-1"
                    style={{ color: '#5eead4' }}
                  >
                    <AnimatedCounter
                      target={s.value}
                      prefix={s.prefix}
                      suffix={s.suffix}
                    />
                  </p>
                  <p className="text-slate-400 text-xs leading-snug">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Portafolio de Demos ──────────────────────────────────────── */}
          <section className="mb-24">
            <h2 className="text-2xl font-bold mb-2 tracking-wide">Portafolio de Demos</h2>
            <p className="text-slate-400 text-sm mb-8">Explora casos de uso reales con IA conversacional</p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {PORTFOLIO.map((entry) => {
                const accent = entry.preview.accentColor;
                const inner = (
                  <article
                    className={`flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${entry.hoverClass}`}
                    style={{
                      background: entry.cardClass,
                      borderColor: `${accent}44`,
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 0 32px ${accent}14`,
                    }}
                  >
                    <div className="min-h-[220px] flex-[3] min-h-0">
                      <DemoPreview {...entry.preview} />
                    </div>
                    <div className="flex flex-[2] flex-col border-t border-white/10 p-5">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold tracking-wide text-white">
                          <span className="mr-1.5">{entry.emoji}</span>
                          {entry.title}
                        </h3>
                        <span
                          className="shrink-0 rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-emerald-400/95"
                          title="Demo interactiva"
                        >
                          ● Vivo
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{entry.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {entry.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                      <span
                        className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${entry.ctaClass}`}
                      >
                        Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      <p className="mt-2 text-center text-xs text-slate-500">
                        Desde <span className="font-medium text-slate-300">$399 MXN/mes</span>
                        <span className="text-slate-600">*</span>
                      </p>
                    </div>
                  </article>
                );
                return entry.external ? (
                  <a
                    key={entry.href}
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={entry.href} href={entry.href} className="group block">
                    {inner}
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-slate-600">
              * El precio final depende del nivel de personalización e integraciones requeridas.{' '}
              <a
                href="https://wa.me/529998080265"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-500 hover:underline"
              >
                Solicita tu presupuesto exacto →
              </a>
            </p>
          </section>

          {/* ── BLOQUE C — INDUSTRIAS ATENDIDAS ─────────────────────────── */}
          <section className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Soluciones para cada industria</h2>
              <p className="text-slate-400 text-sm">Un sistema adaptado a tu negocio, no al revés</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {INDUSTRIAS.map((ind, i) => (
                <motion.div
                  key={ind.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  whileHover={{ scale: 1.06, borderColor: 'rgba(13,148,136,0.7)' }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium cursor-default transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#cbd5e1',
                  }}
                >
                  <span className="text-base">{ind.emoji}</span>
                  {ind.label}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── BLOQUE B — TESTIMONIOS ───────────────────────────────────── */}
          <section className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Lo que dicen nuestros clientes</h2>
              <p className="text-slate-400 text-sm">Negocios reales, resultados reales</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIOS.map((t, i) => (
                <motion.div
                  key={t.nombre}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  whileHover={{ y: -4, boxShadow: `0 12px 40px ${t.color}22` }}
                  className="rounded-xl p-5 flex flex-col gap-3"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: t.color + '33', border: `1.5px solid ${t.color}66` }}
                    >
                      <span style={{ color: t.color }}>{initials(t.nombre)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{t.nombre}</p>
                      <p className="text-slate-500 text-xs truncate">{t.cargo} · {t.negocio}</p>
                      <p className="text-slate-600 text-[10px]">{t.ciudad}</p>
                    </div>
                  </div>
                  {/* Stars */}
                  <Stars />
                  {/* Text */}
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">
                    &ldquo;{t.texto}&rdquo;
                  </p>
                  {/* Date */}
                  <p className="text-slate-600 text-[10px]">{t.fecha}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── CTA FINAL ───────────────────────────────────────────────── */}
          <section className="mb-16">
            <div
              className="rounded-2xl px-8 py-14 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(59,130,246,0.14) 100%)',
                border: '1px solid rgba(13,148,136,0.3)',
              }}
            >
              {/* Glow spot */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(13,148,136,0.18) 0%, transparent 65%)' }}
              />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  ¿Listo para automatizar<br className="hidden sm:block" /> tu negocio?
                </h2>
                <p className="text-slate-400 text-base mb-8 max-w-md mx-auto">
                  Agenda una demo personalizada. Sin compromisos.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <a
                    href="https://wa.me/529998080265"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 btn-cta w-full sm:w-auto justify-center"
                  >
                    <span>💬</span> Escribir a Agentia por WhatsApp
                  </a>
                  <a
                    href="mailto:contacto@agentia.software"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 w-full sm:w-auto justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#e2e8f0',
                    }}
                  >
                    <span>📧</span> Enviar mensaje
                  </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="text-teal-400">✓</span> Sin permanencia
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-teal-400">✓</span> Implementación en 7 días
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-teal-400">✓</span> Soporte incluido
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer
            className="pt-8 text-center text-slate-500 text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            © {new Date().getFullYear()} Agentia · CRM & Chatbot con IA
          </footer>

        </div>
      </div>
    </main>
  );
}
