'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Apple,
  Dog,
  Scissors,
  Send,
  Shield,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
  Zap,
} from 'lucide-react';
import { DemoShowcase } from '@/components/DemoShowcase';

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

const LUCIDE_INDUSTRIAS = [
  { Icon: Scissors,        label: 'Barberías' },
  { Icon: UtensilsCrossed, label: 'Restaurantes' },
  { Icon: Sparkles,        label: 'Spas' },
  { Icon: Apple,           label: 'Nutrición' },
  { Icon: Shield,          label: 'Dentistas' },
  { Icon: Wrench,          label: 'Talleres' },
  { Icon: Zap,             label: 'Telecomunicaciones' },
  { Icon: Dog,             label: 'Grooming' },
  { Icon: Stethoscope,     label: 'Médicos' },
] as const;

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

// ─── Animated Chat Demo (Hero right column) ───────────────────────────────────
const CHAT_MSGS: { role: 'bot' | 'user'; text: string; buttons?: string[] }[] = [
  { role: 'bot',  text: 'Hola 👋 Soy el asistente de la barbería. ¿En qué te ayudo?' },
  { role: 'user', text: 'Quiero agendar un corte' },
  { role: 'bot',  text: '¡Perfecto Carlos! 🗓️ Tengo disponibilidad:', buttons: ['Hoy — 4:00 PM con Fernando', 'Mañana — 11:00 AM con Sofía'] },
  { role: 'user', text: 'Sí, el de hoy a las 4 🙌' },
  { role: 'bot',  text: '✅ ¡Listo Carlos! Cita confirmada para hoy 4:00 PM con Fernando. ¡Te esperamos!' },
];

function AnimatedChatDemo() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(0);
    setTyping(false);
    const T = (fn: () => void, ms: number) => setTimeout(fn, ms);
    const ts = [
      T(() => setTyping(true), 500),
      T(() => { setTyping(false); setVisible(1); }, 1500),
      T(() => setVisible(2), 2700),
      T(() => setTyping(true), 3200),
      T(() => { setTyping(false); setVisible(3); }, 4300),
      T(() => setVisible(4), 5600),
      T(() => setTyping(true), 6100),
      T(() => { setTyping(false); setVisible(5); }, 7200),
      T(() => setCycleKey((k) => k + 1), 11000),
    ];
    return () => ts.forEach(clearTimeout);
  }, [cycleKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [visible, typing]);

  return (
    <div
      className="w-full max-w-[320px] rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: '#000',
        border: '1px solid rgba(34,197,94,0.35)',
        boxShadow: '0 0 50px rgba(34,197,94,0.18), 0 20px 60px rgba(0,0,0,0.6)',
        height: '520px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.9)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: '#000', border: '1.5px solid #22c55e' }}
        >
          <Image src="/logo-agentia-2026.png" alt="Agentia" width={28} height={28} className="rounded-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Barbería Demo</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400">en línea</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ background: '#0b141a' }}>
        {CHAT_MSGS.slice(0, visible).map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%]">
              <div
                className="rounded-2xl px-3 py-2 text-xs leading-relaxed"
                style={
                  m.role === 'user'
                    ? { background: '#22c55e', color: '#fff', borderRadius: '1rem 1rem 0.25rem 1rem' }
                    : { background: '#202c33', color: '#e2e8f0', borderRadius: '1rem 1rem 1rem 0.25rem' }
                }
              >
                {m.text}
              </div>
              {m.buttons && (
                <div className="mt-1.5 space-y-1">
                  {m.buttons.map((b) => (
                    <div
                      key={b}
                      className="rounded-lg px-3 py-1.5 text-[10px] text-center"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-2.5 flex items-center gap-1"
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
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ background: '#0b141a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex-1 rounded-full px-4 py-2 text-[11px] text-slate-500"
          style={{ background: '#2a3942' }}
        >
          Escribe un mensaje…
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#22c55e' }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

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
        <div className="max-w-7xl mx-auto">

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
          <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                IA activa 24/7
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold mb-5 leading-tight tracking-tight text-white">
                Tu negocio
                <br />
                <span style={{ color: '#22c55e' }}>automatizado</span>
                <br />
                en WhatsApp
              </h1>

              {/* Subtitle */}
              <p className="text-slate-400 text-lg max-w-lg mb-8 leading-relaxed">
                Chatbots con IA que agendan, cobran y fidelizan clientes — sin que tú hagas nada.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <a
                  href="#demos"
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: '#22c55e' }}
                >
                  Ver demos en vivo
                </a>
                <a
                  href="https://wa.me/529998080265"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
                  style={{ border: '1.5px solid rgba(255,255,255,0.28)', background: 'transparent' }}
                >
                  Ver precios
                </a>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-6">
                {[
                  { value: '9+', label: 'industrias' },
                  { value: 'desde $399', label: 'por mes' },
                  { value: '7 días', label: 'implementación' },
                ].map((m) => (
                  <div key={m.value} className="flex flex-col">
                    <span className="text-xl font-extrabold text-white">{m.value}</span>
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: animated phone */}
            <div className="flex justify-center lg:justify-end">
              <AnimatedChatDemo />
            </div>
          </section>

          {/* ── Industry chips (Lucide icons) ────────────────────────────── */}
          <section className="mb-16">
            <div
              className="rounded-2xl px-6 py-5 flex flex-wrap justify-center gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {LUCIDE_INDUSTRIAS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-400 transition-colors hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                  {label}
                </div>
              ))}
            </div>
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
          <section id="demos" className="mb-24">
            <h2 className="text-2xl font-bold mb-2 tracking-wide">Portafolio de Demos</h2>
            <p className="text-slate-400 text-sm mb-8">Explora casos de uso reales con IA conversacional</p>
            <DemoShowcase />
            <p className="mt-6 text-center text-xs text-slate-600">
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
