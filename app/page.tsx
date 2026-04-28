'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroPhoneMockup } from '@/components/HeroPhoneMockup';
import { IndustrySelectorGrid } from '@/components/IndustrySelectorGrid';
import { useAnalytics } from '@/src/lib/analytics-client';

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

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useAnalytics();
  return (
    <main
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: '#000' }}
    >
      {/* Radial glow — top right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 20%, rgba(34,197,94,0.1) 0%, transparent 65%)' }}
      />
      {/* Faint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">

          {/* ── Navbar ─────────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-0.5" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
                <Image
                  src="/logo-agentia-2026.png"
                  alt="Agentia"
                  width={48}
                  height={48}
                  className="rounded-lg object-contain w-12 h-12"
                />
              </div>
              <span className="text-lg font-bold tracking-wide text-white hidden sm:block">Agentia</span>
            </div>
            <Link
              href="/login?from=/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:border-green-400/60"
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                color: '#4ade80',
              }}
            >
              Acceso Clientes
            </Link>
          </header>

          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <section className="mb-16">
            {/*
              Mobile: mockup top (order-first), text bottom (order-last)
              Desktop (md+): two columns — text left, mockup right
            */}
            <div className="flex flex-col md:grid md:grid-cols-2 md:items-center gap-10 md:gap-12">

              {/* Phone mockup — top on mobile, right on desktop */}
              <div className="flex justify-center order-first md:order-last md:justify-end">
                <HeroPhoneMockup />
              </div>

              {/* Text — bottom on mobile, left on desktop */}
              <div className="order-last md:order-first">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  IA activa 24/7
                </div>

                {/* H1 */}
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-[1.12] tracking-tight text-white">
                  Tu negocio
                  <br />
                  <span style={{ color: '#22c55e' }}>automatizado</span>
                  <br />
                  en WhatsApp
                </h1>

                {/* Subtitle */}
                <p className="text-slate-400 text-base sm:text-lg max-w-md mb-7 leading-relaxed">
                  Chatbots con IA que agendan, cobran y fidelizan clientes — sin que tú hagas nada.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <a
                    href="#demos"
                    className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                    style={{ background: '#22c55e' }}
                  >
                    Ver demos en vivo
                  </a>
                  <a
                    href="https://wa.me/529998080265"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-75"
                    style={{ border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent' }}
                  >
                    Ver precios
                  </a>
                </div>

                {/* Stats row — 3 items, compact for mobile */}
                <div className="flex gap-5 sm:gap-8">
                  {[
                    { value: '9+',      label: 'industrias' },
                    { value: '24/7',    label: 'activo' },
                    { value: '7 días',  label: 'implementación' },
                  ].map((s) => (
                    <div key={s.value} className="flex flex-col min-w-0">
                      <span className="text-lg sm:text-xl font-extrabold text-white leading-tight">{s.value}</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Industry selector ───────────────────────────────────────────── */}
          <div id="demos">
            <IndustrySelectorGrid />
          </div>

          {/* ── Testimonios ─────────────────────────────────────────────────── */}
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
                  <Stars />
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">
                    &ldquo;{t.texto}&rdquo;
                  </p>
                  <p className="text-slate-600 text-[10px]">{t.fecha}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── CTA Final ───────────────────────────────────────────────────── */}
          <section className="mb-16">
            <div
              className="rounded-2xl px-8 py-14 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.10) 100%)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.14) 0%, transparent 65%)' }}
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
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
                    style={{ background: '#22c55e' }}
                  >
                    <span>💬</span> Escribir a Agentia por WhatsApp
                  </a>
                  <a
                    href="mailto:contacto@agentia.software"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-80 w-full sm:w-auto justify-center"
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
                  {['Sin permanencia', 'Implementación en 7 días', 'Soporte incluido'].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span className="text-green-400">✓</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <footer
            className="pt-8 text-center text-slate-500 text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p>© {new Date().getFullYear()} Agentia · CRM & Chatbot con IA</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <Link href="/legal/terminos" className="hover:text-slate-300 transition-colors">Términos y Condiciones</Link>
              <span>·</span>
              <Link href="/legal/privacidad" className="hover:text-slate-300 transition-colors">Aviso de Privacidad</Link>
            </div>
          </footer>

        </div>
      </div>
    </main>
  );
}
