'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Shield } from 'lucide-react';
import { AutomationSimulator } from '@/components/landing/AutomationSimulator';
import { GlowButton } from '@/components/landing/GlowButton';
import { ParticleField } from '@/components/landing/ParticleField';
import { TypewriterHeadline } from '@/components/landing/TypewriterHeadline';
import {
  AGENTIA_WHATSAPP_DISPLAY,
  agentiaWhatsAppUrl,
} from '@/lib/agentia-contact';

const CYAN = '#00D4FF';
const GOLD = '#FFD700';
const BG = '#0a0a0a';

const PAIN_POINTS = [
  '¿Tu equipo pasa horas copiando datos entre WhatsApp, Excel y tu CRM?',
  '¿Pierdes leads porque tardas más de 5 min en responder en redes sociales?',
  '¿Tus empleados están atrapados en tareas repetitivas en lugar de vender?',
  '¿Recibes mensajes a las 2am que no puedes atender y el cliente se va?',
];

const CASE_STUDIES = [
  {
    name: 'CWF México',
    url: 'https://cwf.com.mx',
    href: '/cwf-panel/login',
    accent: '#8B4513',
    sector: 'Distribución / Tratamiento de Madera',
    antes:
      'Calificación manual de leads, respuestas de 4+ horas en fines de semana.',
    despues:
      'Agente IA entrenado en catálogo Flood CWF-UV, califica y cotiza en 45 segundos.',
    impacto: '+35% conversión lead→venta, 0 leads ignorados',
    construido: 'E-commerce + Chatbot IA experto en madera + WeShip + Panel CRM',
  },
  {
    name: 'Deco House',
    url: 'Chile',
    href: '/demo/deco-house',
    accent: '#00B4D8',
    sector: 'Vidrio y Aluminio',
    antes: 'Cotizaciones manuales lentas, pérdida de leads por tiempo de respuesta.',
    despues: '"Elisa" califica leads 24/7, dueño genera PDF de cotización en 1 clic.',
    impacto: 'Pipeline visible, 0 cotizaciones perdidas',
    construido: 'Chatbot + CRM + Generador PDF + Toma de control humana',
  },
  {
    name: 'izzi',
    url: 'Mérida',
    href: '/izzi/merida',
    accent: '#FF6B35',
    sector: 'Telecomunicaciones',
    whiteLogo: true,
    antes: 'Agentes respondiendo disponibilidad y tarifas repetitivas manualmente.',
    despues: 'OCR lee INE y comprobante automático, cierra venta y notifica al asesor.',
    impacto: '-60% costo operativo atención inicial',
    construido: 'Landing + Chatbot OCR + Notificaciones inteligentes',
  },
  {
    name: 'Biovela — La Rueda Veladoras',
    href: '/biovela',
    accent: '#FF85A1',
    sector: 'E-commerce artesanal',
    antes: 'Ventas manuales, sin tienda online, sin envíos automatizados.',
    despues: 'Ecosistema completo integrado desde día 1.',
    impacto: 'Operación 100% digital desde día 1',
    construido: 'Tiendanube 128+ productos + Clip + MercadoPago + WeShip + Chatbot + Landing',
  },
  {
    name: 'Luciano Ads',
    url: 'Argentina',
    href: '/portal/luciano/cliente/luciano',
    accent: '#7B2FBE',
    sector: 'Agencia / Marketing Digital',
    antes: '26 asesoras sin sistema centralizado, leads perdidos sin seguimiento.',
    despues: 'CRM individual por asesora, notificación en tiempo real vía app PWA.',
    impacto: '1,963 leads procesados en un mes',
    construido: 'CRM + Zapier + App PWA (sin descargar) + Meta API oficial',
  },
  {
    name: 'Volanteo Tracker',
    href: '/tracking-panel',
    accent: '#00FF88',
    sector: 'Telecomunicaciones / Empresas de Campo',
    antes: 'Supervisores sin visibilidad del equipo en campo, sin forma de validar rutas.',
    despues: 'Dashboard en tiempo real con mapa de calor de zonas cubiertas.',
    impacto: 'Control total del equipo de campo, reducción de fraude en distribución',
    construido: 'Flutter Android + Panel Next.js + GPS tracking + Mapas en tiempo real',
    extra: [
      'Localización GPS en tiempo real de cada miembro del equipo',
      'Mapa interactivo con rutas trazadas e historial de recorridos',
      'Ideal para telecom, volanteo, promotores y técnicos de instalación',
    ],
  },
  {
    name: 'Industria Restaurantera',
    accent: '#FF9F1C',
    sector: 'Gastronomía',
    antes: 'Reservas y pedidos dispersos en WhatsApp sin sistema.',
    despues: 'Menús interactivos, lealtad digital y reservas automáticas.',
    impacto: 'Y muchos más proyectos en producción',
    construido: 'Menús tipo red social + tarjetas de lealtad + reservas WhatsApp + contenido para redes',
    isTeaser: true,
  },
];

const TECH_INTEGRATIONS = [
  { name: 'Meta', slug: 'meta', color: '00D4FF' },
  { name: 'WhatsApp', slug: 'whatsapp', color: '25D366' },
  { name: 'Zapier', slug: 'zapier', color: 'FF4F00' },
  { name: 'Tiendanube', slug: 'nuvemshop', color: '2E3192' },
  { name: 'Stripe', slug: 'stripe', color: '635BFF' },
  { name: 'Mercado Pago', slug: 'mercadopago', color: '00B1EA' },
  { name: 'Cloudinary', slug: 'cloudinary', color: '3448C5' },
  { name: 'MongoDB', slug: 'mongodb', color: '47A248' },
  { name: 'Vercel', slug: 'vercel', color: 'ffffff' },
];

const PAYMENTS = ['Stripe', 'MercadoPago', 'Clip', 'PayPal'];
const SHIPPING = ['WeShip', 'FedEx', 'DHL', 'Estafeta'];

const PHASES = [
  {
    n: '01',
    title: 'Diagnóstico (Gratis)',
    desc: 'Cuantificamos oportunidad y cuellos de botella con datos, no con suposiciones.',
  },
  {
    n: '02',
    title: 'Blueprint (Garantía de Arquitectura)',
    desc: 'Diseñamos el mapa de automatización antes de cobrar desarrollo.',
  },
  {
    n: '03',
    title: 'Implementación Llave en Mano',
    desc: 'Desarrollamos, conectamos, desplegamos y mantenemos tu operación.',
  },
];

function Glass({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function scrollToSimulator() {
  document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' });
}

export function AgentiaLandingPage() {
  const reduceMotion = useReducedMotion();
  const waUrl = agentiaWhatsAppUrl('Hola, quiero auditar mi negocio con Agentia.');

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-inter)] text-white"
      style={{ background: BG }}
    >
      <ParticleField />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 20% -5%, rgba(0,212,255,0.12), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 15%, rgba(255,215,0,0.07), transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={44} height={44} className="rounded-lg" priority />
            <span className="hidden font-[family-name:var(--font-space)] text-lg font-bold sm:block">Agentia</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#dolor" className="hover:text-[#00D4FF]">Diagnóstico</a>
            <a href="#simulador" className="hover:text-[#00D4FF]">Simulador</a>
            <a href="#casos" className="hover:text-[#00D4FF]">Casos</a>
            <a href="#integraciones" className="hover:text-[#00D4FF]">Stack</a>
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-1.5 text-[11px] text-[#00D4FF]">
            <Shield className="h-3.5 w-3.5" />
            Partner oficial Meta
          </div>
        </header>

        {/* Hero */}
        <section className="grid min-h-[calc(100dvh-5rem)] items-center gap-12 py-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-medium text-[#FFD700]">
              Arquitectura de Automatización
            </p>
            <h1 className="font-[family-name:var(--font-space)] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[2.75rem]">
              ¿Sabes cuánto dinero pierde tu empresa cada mes por{' '}
              <TypewriterHeadline />
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Calculamos tu fuga de ingresos y diseñamos tu arquitectura de automatización antes de escribir
              una sola línea de código. En 3 minutos, sin llamadas de ventas.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={scrollToSimulator}
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-[#0a0a0a] shadow-[0_0_40px_rgba(0,212,255,0.35)] transition hover:shadow-[0_0_56px_rgba(0,212,255,0.5)]"
                style={{ background: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                Auditar mi Negocio Gratis
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45 sm:text-sm">
              <span>
                <strong className="text-white">+140</strong> procesos automatizados
              </span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span>
                <strong className="text-[#FFD700]">+$12.4M MXN</strong> recuperados
              </span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span>
                <strong className="text-white">98%</strong> satisfacción
              </span>
            </div>

            <p className="mt-6 text-xs text-white/40">
              Partner oficial Meta — WhatsApp Business API
            </p>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Glass className="p-6 sm:p-8">
              <p className="text-xs uppercase tracking-widest text-white/40">Vista previa del simulador</p>
              <p className="mt-3 font-[family-name:var(--font-space)] text-2xl font-bold">
                Fuga estimada: <span className="text-[#FF3B3B]">$47,200 MXN/mes</span>
              </p>
              <p className="mt-2 text-sm text-white/50">
                Basado en operaciones similares en tu industria. Ajusta tus números en el simulador.
              </p>
              <div className="mt-6 space-y-3">
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full w-[34%] rounded-full bg-[#FF3B3B]" />
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-[#00D4FF]" />
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full w-[58%] rounded-full bg-[#FFD700]" />
                </div>
              </div>
              <button
                type="button"
                onClick={scrollToSimulator}
                className="mt-6 w-full rounded-xl border border-[#00D4FF]/30 py-3 text-sm font-semibold text-[#00D4FF] hover:bg-[#00D4FF]/10"
              >
                Calcular mi fuga real
              </button>
            </Glass>
          </motion.div>
        </section>

        {/* Pain mirror */}
        <section id="dolor" className="scroll-mt-24 py-16">
          <Glass className="p-8 sm:p-10">
            <h2 className="font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              Si te pasa esto, estás dejando dinero sobre la mesa:
            </h2>
            <ul className="mt-8 space-y-4">
              {PAIN_POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-sm leading-relaxed text-white/70 sm:text-base">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#00D4FF]" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg font-semibold text-white">Calculemos exactamente cuánto.</p>
            <button
              type="button"
              onClick={scrollToSimulator}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#00D4FF] hover:underline"
            >
              Ir al simulador <ArrowRight className="h-4 w-4" />
            </button>
          </Glass>
        </section>

        <AutomationSimulator />

        {/* Case studies */}
        <section id="casos" className="scroll-mt-24 py-16">
          <h2 className="mb-10 font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
            Casos de éxito
          </h2>
          <div className="space-y-6">
            {CASE_STUDIES.map((c) => (
              <Glass
                key={c.name}
                className="overflow-hidden p-6 sm:p-8"
                style={{ borderLeftWidth: 4, borderLeftColor: c.accent }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {'whiteLogo' in c && c.whiteLogo ? (
                      <p
                        className="font-[family-name:var(--font-space)] text-2xl font-extrabold tracking-tight text-white"
                        style={{ textShadow: '0 0 24px rgba(255,107,53,0.4)' }}
                      >
                        izzi
                      </p>
                    ) : (
                      <h3 className="font-[family-name:var(--font-space)] text-xl font-bold" style={{ color: c.accent }}>
                        {c.name}
                      </h3>
                    )}
                    <p className="mt-1 text-xs uppercase tracking-wider text-white/45">{c.sector}</p>
                  </div>
                  {c.href ? (
                    <Link href={c.href} className="text-xs font-semibold hover:underline" style={{ color: c.accent }}>
                      Ver proyecto →
                    </Link>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400/90">Antes</p>
                    <p className="mt-2 text-sm text-white/60">{c.antes}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#00D4FF]">Después</p>
                    <p className="mt-2 text-sm text-white/60">{c.despues}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFD700]">Impacto</p>
                    <p className="mt-2 text-sm font-semibold text-white/80">{c.impacto}</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-white/40">
                  <span className="text-white/55">Construido:</span> {c.construido}
                </p>

                {'extra' in c && c.extra ? (
                  <ul className="mt-4 space-y-1 text-sm text-white/50">
                    {c.extra.map((e) => (
                      <li key={e}>✓ {e}</li>
                    ))}
                  </ul>
                ) : null}
              </Glass>
            ))}
          </div>
        </section>

        {/* How we work */}
        <section className="py-16">
          <h2 className="mb-10 font-[family-name:var(--font-space)] text-3xl font-bold">
            Cómo trabajamos
          </h2>
          <p className="mb-8 max-w-2xl text-white/55">
            Tres fases para eliminar el miedo al software y convertir automatización en ingresos recuperados.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {PHASES.map((p) => (
              <Glass key={p.n} className="p-6">
                <span className="font-mono text-sm text-[#FFD700]">{p.n}</span>
                <h3 className="mt-2 font-[family-name:var(--font-space)] text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/55">{p.desc}</p>
              </Glass>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section id="integraciones" className="scroll-mt-24 py-16">
          <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold">Nuestras integraciones</h2>
          <p className="mt-3 text-white/55">Hablamos el mismo idioma que tus herramientas actuales</p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {TECH_INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-3 py-5 opacity-70 transition hover:opacity-100"
              >
                <img
                  src={`https://cdn.simpleicons.org/${item.slug}/${item.color}`}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                />
                <span className="mt-2 text-center text-[10px] text-white/50">{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payments & shipping */}
        <section className="py-12">
          <Glass className="p-8">
            <h3 className="font-[family-name:var(--font-space)] text-xl font-bold">
              Integramos pagos y logística en tu operación
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">Pagos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PAYMENTS.map((p) => (
                    <span key={p} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">Paqueterías</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SHIPPING.map((p) => (
                    <span key={p} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Glass>
        </section>

        {/* Final CTA */}
        <section className="py-12">
          <Glass className="px-6 py-12 text-center sm:px-10">
            <h2 className="font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              Recupera ingresos. Libera capacidad operativa.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/55">
              Empieza con el diagnóstico gratuito. Sin pitch de ventas en la primera interacción.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToSimulator}
                className="rounded-xl px-7 py-3.5 text-sm font-bold text-[#0a0a0a]"
                style={{ background: CYAN }}
              >
                Auditar mi Negocio Gratis
              </button>
              <GlowButton href={waUrl} external variant="secondary">
                WhatsApp {AGENTIA_WHATSAPP_DISPLAY}
              </GlowButton>
            </div>
          </Glass>
        </section>

        <footer className="border-t border-white/8 pt-10 text-center text-sm text-white/40">
          <p className="font-[family-name:var(--font-space)] text-white/70">Agentia</p>
          <p className="mt-2">Arquitectura de Automatización · Partner Meta WhatsApp Business API</p>
          <p className="mt-3">
            <a href={waUrl} className="hover:text-[#00D4FF]">
              WhatsApp {AGENTIA_WHATSAPP_DISPLAY}
            </a>
            {' · '}
            <a href="mailto:contacto@agentia.software" className="hover:text-[#00D4FF]">
              contacto@agentia.software
            </a>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            <Link href="/legal/terminos" className="hover:text-white/70">
              Términos
            </Link>
            <Link href="/legal/privacidad" className="hover:text-white/70">
              Privacidad
            </Link>
            <Link href="/dashboard" className="hover:text-white/70">
              Dashboard
            </Link>
          </div>
          <p className="mt-6">© {new Date().getFullYear()} Agentia</p>
        </footer>
      </div>
    </main>
  );
}
