'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Clock,
  GraduationCap,
  HeartPulse,
  Scissors,
  PawPrint,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';

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

          {/* Header / Logo */}
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

          {/* Hero */}
          <section className="mb-24">
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
            <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
              Chatbots con IA, CRM integrado y flujos de venta automatizados.
              Atención 24/7 sin aumentar tu equipo.
            </p>
            <Link
              href="/login?from=/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all duration-300 btn-cta"
            >
              Acceso Clientes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-4 mb-24">
            {[
              { icon: Clock,    value: '24/7', label: 'Atención sin horarios' },
              { icon: Zap,      value: 'IA',   label: 'Gemini 2.5 Flash' },
              { icon: BarChart3, value: 'CRM', label: 'Pipeline integrado' },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={value}
                className="rounded-xl p-5 text-center transition-all duration-300 group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Icon className="w-5 h-5 mx-auto mb-2 text-teal-400 opacity-70" />
                <p
                  className="font-extrabold text-2xl mb-1"
                  style={{ color: '#5eead4' }}
                >
                  {value}
                </p>
                <p className="text-slate-400 text-xs">{label}</p>
              </div>
            ))}
          </section>

          {/* Portafolio de Demos */}
          <section className="mb-24">
            <h2 className="text-2xl font-bold mb-2 tracking-wide">Portafolio de Demos</h2>
            <p className="text-slate-400 text-sm mb-8">Explora casos de uso reales con IA conversacional</p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {/* 1 — Barbería */}
              <Link href="/demo/barber" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(13,148,136,0.07)',
                    border: '1px solid rgba(13,148,136,0.3)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(13,148,136,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.6)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(13,148,136,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.3)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(13,148,136,0.08)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}
                  >
                    <Scissors className="w-6 h-6 text-teal-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Barbería</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Reservas con IA, calendario en vivo y detección de conflictos de horarios. Demo completa disponible.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm" style={{ color: '#5eead4' }}>
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 2 — Cobranza & Cartera */}
              <Link href="/demo/cobranza" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(30,64,175,0.12)',
                    border: '1px solid rgba(30,64,175,0.45)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(30,64,175,0.12)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.7)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(30,64,175,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,64,175,0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(30,64,175,0.12)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(30,64,175,0.25)', border: '1px solid rgba(59,130,246,0.5)' }}
                  >
                    <GraduationCap className="w-6 h-6 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Cobranza &amp; Cartera</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Dashboard de morosidad, secuencias automáticas, estado de cuenta PDF y score de riesgo con IA para
                    instituciones y empresas.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['📊 Score IA', '🧾 PDF', '🤖 Secuencias', '💬 WhatsApp'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-blue-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 3 — Inmobiliaria (externo) */}
              <a
                href="https://inmobiliaria-agentia.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(5,150,105,0.1)',
                    border: '1px solid rgba(5,150,105,0.35)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(5,150,105,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.65)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(5,150,105,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(5,150,105,0.35)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(5,150,105,0.08)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(16,185,129,0.45)' }}
                  >
                    <Building2 className="w-6 h-6 text-emerald-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Inmobiliaria IA</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Portal de propiedades con IA, calificación de leads automática, análisis de plusvalía y ROI por
                    propiedad.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['🏠 Portal', '📈 ROI', '🤖 Leads IA', '📍 Mapa'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-emerald-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </a>

              {/* 4 — Restaurantes */}
              <Link href="/demo/restaurante" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.4)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(220, 38, 38, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248, 113, 113, 0.65)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(220, 38, 38, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220, 38, 38, 0.4)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(220, 38, 38, 0.1)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(220, 38, 38, 0.22)', border: '1px solid rgba(248, 113, 113, 0.45)' }}
                  >
                    <UtensilsCrossed className="w-6 h-6 text-red-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Restaurantes</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Sistema completo para bar-restaurante: menú QR, panel de cocina, delivery con CRM, inventario y caja
                    con IA.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['📱 Menú QR', '🍳 Cocina', '🛵 Delivery', '🤖 Chat IA'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-red-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 5 — Spa & Estética */}
              <Link href="/demo/spa" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.4)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(147, 51, 234, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236, 72, 153, 0.55)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(147, 51, 234, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(147, 51, 234, 0.4)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(147, 51, 234, 0.1)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(147, 51, 234, 0.22)', border: '1px solid rgba(236, 72, 153, 0.45)' }}
                  >
                    <Sparkles className="w-6 h-6 text-fuchsia-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Spa &amp; Estética</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Agenda semanal, clientes VIP, servicios y recordatorios; dashboard con KPIs y chat IA para recepción.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['📅 Agenda', '💜 KPIs', '✨ Servicios', '🤖 Chat IA'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-fuchsia-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 6 — Grooming Canino */}
              <Link href="/demo/grooming" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.45)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(249, 115, 22, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251, 146, 60, 0.75)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(249, 115, 22, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249, 115, 22, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(249, 115, 22, 0.1)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(249, 115, 22, 0.22)', border: '1px solid rgba(251, 146, 60, 0.5)' }}
                  >
                    <PawPrint className="w-6 h-6 text-orange-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Grooming Canino</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Fichas de mascotas, agenda, servicio a domicilio con seguimiento y recordatorios inteligentes.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['🐾 Fichas', '📅 Agenda', '🚐 Domicilio', '🤖 Chat IA'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-orange-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 7 — Clínica Dental */}
              <Link href="/demo/dentista" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(2, 132, 199, 0.1)',
                    border: '1px solid rgba(2, 132, 199, 0.45)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(2, 132, 199, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56, 189, 248, 0.75)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(2, 132, 199, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(2, 132, 199, 0.1)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(2, 132, 199, 0.22)', border: '1px solid rgba(56, 189, 248, 0.5)' }}
                  >
                    <Stethoscope className="w-6 h-6 text-sky-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Clínica Dental</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Expediente clínico con odontograma, recetas PDF, agenda por dentista y cobranza.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['🦷 Expediente', '💊 Recetas PDF', '📅 Agenda', '💰 Pagos'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-sky-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>

              {/* 8 — Médico & Especialistas */}
              <Link href="/demo/medico" className="block group">
                <article
                  className="rounded-xl p-7 transition-all duration-300 h-full"
                  style={{
                    background: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid rgba(22, 163, 74, 0.45)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 32px rgba(22, 163, 74, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74, 222, 128, 0.75)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(22, 163, 74, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(22, 163, 74, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(22, 163, 74, 0.1)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(22, 163, 74, 0.22)', border: '1px solid rgba(74, 222, 128, 0.5)' }}
                  >
                    <HeartPulse className="w-6 h-6 text-green-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-wide text-white">Médico & Especialistas</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Expediente con signos vitales, especialidades, recetas CIE-10, incapacidad PDF y recordatorios.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['📋 Expediente', '📈 Signos vitales', '💊 Recetas+Incapacidad', '🤖 IA'].map((chip) => (
                      <span
                        key={chip}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-semibold text-sm text-green-300">
                    Ver demo en vivo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>
            </div>
          </section>

          {/* Footer */}
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
