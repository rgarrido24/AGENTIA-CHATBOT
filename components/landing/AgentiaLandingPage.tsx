'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Shield, X } from 'lucide-react';
import { AutomationSimulator } from '@/components/landing/AutomationSimulator';
import { CaseStudyMock } from '@/components/landing/CaseStudyMock';
import { GlowButton } from '@/components/landing/GlowButton';
import { IzziWhiteLogo } from '@/components/landing/IzziWhiteLogo';
import { LiveDemosSection } from '@/components/landing/LiveDemosSection';
import { MetaEcosystemSection } from '@/components/landing/MetaEcosystemSection';
import { ModernChatPreview, type ChatLine } from '@/components/landing/ModernChatPreview';
import { ParticleField } from '@/components/landing/ParticleField';
import { CircuitField } from '@/components/landing/CircuitField';
import { CodeRain } from '@/components/landing/CodeRain';
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
    id: 'cwf',
    name: 'CWF México',
    externalHref: 'https://cwf.com.mx',
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
    id: 'deco',
    name: 'Deco House',
    href: '/proyectos/deco-house',
    url: 'Chile',
    accent: '#00B4D8',
    sector: 'Vidrio y Aluminio',
    antes: 'Cotizaciones manuales lentas, pérdida de leads por tiempo de respuesta.',
    despues: '"Elisa" califica leads 24/7, dueño genera PDF de cotización en 1 clic.',
    impacto: 'Pipeline visible, 0 cotizaciones perdidas',
    construido: 'Chatbot + CRM + Generador PDF + Toma de control humana',
  },
  {
    id: 'izzi',
    name: 'izzi',
    href: '/izzi/merida',
    url: 'Mérida',
    accent: '#FF6B35',
    sector: 'Telecomunicaciones',
    antes: 'Agentes respondiendo disponibilidad y tarifas repetitivas manualmente.',
    despues: 'OCR lee INE y comprobante automático, cierra venta y notifica al asesor.',
    impacto: '-60% costo operativo atención inicial',
    construido: 'Landing + Chatbot OCR + Notificaciones inteligentes',
  },
  {
    id: 'biovela',
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
    id: 'luciano',
    name: 'Luciano Ads',
    href: '/proyectos/luciano-ads',
    url: 'Argentina',
    accent: '#7B2FBE',
    sector: 'Agencia / Marketing Digital',
    antes: '26 asesoras sin sistema centralizado, leads perdidos sin seguimiento.',
    despues: 'CRM individual por asesora, notificación en tiempo real vía app PWA.',
    impacto: '1,963 leads procesados en un mes (simulación de volumen)',
    construido: 'CRM + Zapier + App PWA (sin descargar) + Meta API oficial',
  },
  {
    id: 'restaurante',
    name: 'Masa Madre · Restaurante',
    href: '/demos/masa-madre',
    accent: '#C9A84C',
    sector: 'Gastronomía / Menú digital',
    antes: 'Reservas y pedidos dispersos en WhatsApp sin sistema ni menú visual.',
    despues: 'Menú interactivo, pedidos por WhatsApp y programa de lealtad digital.',
    impacto: '+28% ticket promedio con upsell automatizado',
    construido: 'Menú tipo app + pedidos WhatsApp + reservas + contenido para redes',
    extra: [
      'Categorías animadas con fotos reales de platillos',
      'Botón directo a WhatsApp por producto',
      'Ideal para restaurantes, cafés y dark kitchens',
    ],
  },
] as const;

type IntegrationItem = {
  name: string;
  slug?: string;
  color?: string;
  imageUrl?: string;
};

const TECH_INTEGRATIONS: IntegrationItem[] = [
  { name: 'Meta', slug: 'meta', color: '00D4FF' },
  { name: 'WhatsApp', slug: 'whatsapp', color: '25D366' },
  { name: 'Zapier', slug: 'zapier', color: 'FF4F00' },
  {
    name: 'Tiendanube',
    imageUrl: '/logos/tiendanube.svg',
  },
  { name: 'Stripe', slug: 'stripe', color: '635BFF' },
  { name: 'Mercado Pago', slug: 'mercadopago', color: '00B1EA' },
  { name: 'Cloudinary', slug: 'cloudinary', color: '3448C5' },
  { name: 'MongoDB', slug: 'mongodb', color: '47A248' },
  { name: 'Vercel', slug: 'vercel', color: 'ffffff' },
];

const BEFORE_AGENTIA = [
  'Excel manual',
  'WhatsApp sin respuesta',
  'Copiar y pegar',
  'Leads sin seguimiento',
];

const AFTER_AGENTIA = [
  'Todo conectado',
  'IA respondiendo 24/7',
  'Dashboard en tiempo real',
  'Seguimiento automático',
];

const TECH_STACK = [
  'WhatsApp Business API',
  'Claude AI',
  'Gemini',
  'OpenAI',
  'n8n',
  'MongoDB',
  'Supabase',
  'Stripe',
  'MercadoPago',
  'Shopify',
  'Tiendanube',
  'Zapier',
];

const FREE_DELIVERABLES = [
  'Diagnóstico personalizado',
  'ROI estimado',
  'Automatizaciones recomendadas',
  'Arquitectura propuesta',
  'Integraciones sugeridas',
  'Roadmap de implementación',
  'Prioridades claras',
];

const PREVIEW_CASE_IDS = new Set(['deco', 'luciano']);
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
  id,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`group/glass relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition duration-500 hover:border-[#00D4FF]/35 hover:shadow-[0_0_36px_rgba(0,212,255,0.1)] ${className}`}
      style={style}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover/glass:opacity-100"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, transparent 45%, rgba(255,215,0,0.04) 100%)',
        }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

const HERO_CHAT: ChatLine[] = [
  { from: 'user', text: '¿Atienden leads de WhatsApp fuera de horario?' },
  { from: 'bot', text: 'Sí, 24/7. ¿Cuántos leads recibes al mes aproximadamente?' },
  { from: 'user', text: 'Unos 80, pero muchos se enfrían' },
  { from: 'bot', text: 'Con automatización podrías recuperar ~$47k MXN/mes. Te muestro el simulador ↓' },
];

function scrollToSimulator() {
  document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' });
}

export function AgentiaLandingPage() {
  const reduceMotion = useReducedMotion();
  const waUrl = agentiaWhatsAppUrl('Hola, quiero auditar mi negocio con Agentia.');

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-jakarta)] text-white"
      style={{ background: BG }}
    >
      <ParticleField />
      <CircuitField />

      <div
        className="agentia-gradient-motion pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 20% -5%, rgba(0,212,255,0.14), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 15%, rgba(255,215,0,0.09), transparent 50%)',
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
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <a href="#transformacion" className="hover:text-[#00D4FF]">Transformación</a>
            <a href="#tecnologias" className="hover:text-[#00D4FF]">Tech</a>
            <a href="#gratis" className="hover:text-[#00D4FF]">Gratis</a>
            <a href="#simulador" className="hover:text-[#00D4FF]">Simulador</a>
            <a href="#demos" className="hover:text-[#00D4FF]">Demos</a>
            <a href="#meta" className="hover:text-[#00D4FF]">Meta</a>
            <a href="#casos" className="hover:text-[#00D4FF]">Casos</a>
            <a href="#integraciones" className="hover:text-[#00D4FF]">Stack</a>
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-1.5 text-[11px] text-[#00D4FF]">
            <Shield className="h-3.5 w-3.5" />
            Partner oficial Meta
          </div>
        </header>

        {/* Hero */}
        <section className="relative grid min-h-[calc(100dvh-5rem)] items-center gap-12 py-12 lg:grid-cols-2">
          <CodeRain />
          <div className="relative z-10">
            <p className="mb-4 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
              Arquitectura de Automatización
            </p>
            <h1 className="font-[family-name:var(--font-space)] text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.65rem]">
              Tu empresa pierde dinero por{' '}
              <TypewriterHeadline />
              <span className="mt-2 block text-white/90">
                — diseñamos la solución tecnológica con mayor retorno.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              En 5 minutos te mostramos qué automatizar primero y cuánto dinero podrías recuperar.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={scrollToSimulator}
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-[#0a0a0a] shadow-[0_0_40px_rgba(0,212,255,0.35)] transition hover:shadow-[0_0_56px_rgba(0,212,255,0.5)]"
                style={{ background: `linear-gradient(90deg, ${CYAN}, ${GOLD})` }}
              >
                Descubrir cuánto dinero estoy perdiendo
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
            className="relative z-10 w-full lg:max-w-xl"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#00D4FF]/15 via-transparent to-[#FFD700]/10 blur-2xl" aria-hidden />
            <Glass className="relative p-5 sm:p-6">
              <p className="mb-3 text-center text-xs uppercase tracking-widest text-white/40">
                Conversación simulada · WhatsApp
              </p>
              <ModernChatPreview
                businessName="Agentia"
                accent={CYAN}
                messages={HERO_CHAT}
                animate
              />
              <button
                type="button"
                onClick={scrollToSimulator}
                className="mt-4 w-full rounded-xl border border-[#00D4FF]/30 py-3 text-sm font-semibold text-[#00D4FF] transition hover:bg-[#00D4FF]/10"
              >
                Calcular mi fuga real
              </button>
            </Glass>
          </motion.div>
        </section>

        {/* Antes / Después */}
        <section id="transformacion" className="scroll-mt-24 py-16">
          <h2 className="mb-8 font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
            Antes y después de Agentia
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Glass className="p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-red-400/90">
                Antes de Agentia
              </p>
              <ul className="mt-5 space-y-3">
                {BEFORE_AGENTIA.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70 sm:text-base">
                    <X className="h-5 w-5 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Glass>
            <Glass className="p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#00D4FF]">
                Después de Agentia
              </p>
              <ul className="mt-5 space-y-3">
                {AFTER_AGENTIA.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80 sm:text-base">
                    <Check className="h-5 w-5 shrink-0 text-[#00D4FF]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Glass>
          </div>
        </section>

        {/* Qué recibes gratis */}
        <section id="gratis" className="scroll-mt-24 py-16">
          <Glass className="p-8 sm:p-10">
            <h2 className="font-[family-name:var(--font-space)] text-2xl font-bold sm:text-3xl">
              Qué recibes gratis
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Sin compromiso de compra. Solo claridad sobre dónde está tu mayor retorno.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {FREE_DELIVERABLES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/75 sm:text-base">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD700]" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={scrollToSimulator}
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#00D4FF] hover:underline"
            >
              Empezar diagnóstico gratuito <ArrowRight className="h-4 w-4" />
            </button>
          </Glass>
        </section>

        {/* Tecnologías */}
        <section id="tecnologias" className="scroll-mt-24 py-16">
          <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
            Tecnologías
          </h2>
          <p className="mt-3 max-w-2xl text-white/55">
            Integramos el stack que tu operación ya usa — o el que necesita para escalar.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-[#00D4FF]/35 hover:text-white"
              >
                {tech}
              </span>
            ))}
          </div>
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

        <LiveDemosSection />

        <MetaEcosystemSection />

        {/* Case studies */}
        <section id="casos" className="scroll-mt-24 py-16">
          <h2 className="mb-10 font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
            Casos de éxito
          </h2>
          <div className="space-y-6">
            {CASE_STUDIES.map((c) => (
              <Glass
                key={c.id}
                id={`caso-${c.id}`}
                className="scroll-mt-28 overflow-hidden p-6 sm:p-8"
                style={{ borderLeftWidth: 4, borderLeftColor: c.accent }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {c.id === 'izzi' ? (
                      <IzziWhiteLogo className="h-9" />
                    ) : (
                      <h3 className="font-[family-name:var(--font-space)] text-xl font-bold" style={{ color: c.accent }}>
                        {c.name}
                      </h3>
                    )}
                    <p className="mt-1 text-xs uppercase tracking-wider text-white/45">{c.sector}</p>
                  </div>
                  {'externalHref' in c && c.externalHref ? (
                    <a
                      href={c.externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: c.accent }}
                    >
                      Ver proyecto →
                    </a>
                  ) : 'href' in c && c.href && !PREVIEW_CASE_IDS.has(c.id) ? (
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

                <CaseStudyMock id={c.id} preview={PREVIEW_CASE_IDS.has(c.id)} />

                {PREVIEW_CASE_IDS.has(c.id) && 'href' in c && c.href ? (
                  <Link
                    href={c.href}
                    className="mt-4 inline-flex items-center gap-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                    style={{ borderColor: `${c.accent}55`, color: c.accent }}
                  >
                    Ver proyecto →
                  </Link>
                ) : c.id === 'restaurante' && 'href' in c && c.href ? (
                  <Link
                    href={c.href}
                    className="mt-4 inline-flex items-center gap-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                    style={{ borderColor: `${c.accent}55`, color: c.accent }}
                  >
                    Ver demo →
                  </Link>
                ) : null}

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
                {item.imageUrl ? (
                  <div className="flex h-8 items-center justify-center rounded-md bg-white px-2">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width={72}
                      height={24}
                      className="h-5 w-auto max-w-[68px] object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : item.slug ? (
                  <img
                    src={`https://cdn.simpleicons.org/${item.slug}/${item.color}`}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    loading="lazy"
                  />
                ) : null}
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
