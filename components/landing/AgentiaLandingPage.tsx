'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  Bell,
  Bot,
  Globe,
  Layers,
  MessageCircle,
  Plug,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { HeroPhoneMockup } from '@/components/HeroPhoneMockup';
import { IndustrySelectorGrid } from '@/components/IndustrySelectorGrid';
import { GlowButton } from '@/components/landing/GlowButton';
import { ParticleField } from '@/components/landing/ParticleField';
import { TypewriterHeadline } from '@/components/landing/TypewriterHeadline';
import { AGENTIA_WHATSAPP_DISPLAY, agentiaWhatsAppUrl } from '@/lib/agentia-contact';

const CYAN = '#00D4FF';
const GOLD = '#FFD700';
const BG = '#0a0a0a';

const SERVICES = [
  {
    icon: Bot,
    title: 'Chatbots WhatsApp con IA 24/7',
    desc: 'Responde, califica y agenda sin pausas. Tu equipo entra solo cuando hay venta lista.',
  },
  {
    icon: Users,
    title: 'CRM personalizado para ventas',
    desc: 'Pipeline, asignación y seguimiento hechos para equipos comerciales reales, no plantillas genéricas.',
  },
  {
    icon: Globe,
    title: 'Páginas web profesionales',
    desc: 'Landings, catálogos y funnels con diseño premium y conversión medible.',
  },
  {
    icon: MessageCircle,
    title: 'Partner oficial Meta',
    desc: 'API WhatsApp Business certificada para mensajería escalable y plantillas aprobadas.',
  },
  {
    icon: Plug,
    title: 'Zapier y automatizaciones',
    desc: 'Conecta formularios, hojas, CRMs y alertas sin código frágil ni parches manuales.',
  },
  {
    icon: ShoppingBag,
    title: 'Partner oficial Tiendanube',
    desc: 'Sincroniza catálogo, pedidos y atención post-venta con tu tienda en línea.',
  },
  {
    icon: Target,
    title: 'Leads Facebook e Instagram',
    desc: 'Captura automática desde Lead Ads con notificación instantánea a tu equipo.',
  },
  {
    icon: Bell,
    title: 'Notificaciones push PWA',
    desc: 'Alertas en el celular sin descargar app de tienda. Ideal para asesoras en campo.',
  },
];

const INTEGRATIONS = [
  { name: 'Meta', slug: 'meta', color: '00D4FF' },
  { name: 'Zapier', slug: 'zapier', color: 'FF4F00' },
  { name: 'Tiendanube', slug: 'nuvemshop', color: '2E3192' },
  { name: 'WhatsApp', slug: 'whatsapp', color: '25D366' },
  { name: 'Cloudinary', slug: 'cloudinary', color: '3448C5' },
  { name: 'MongoDB', slug: 'mongodb', color: '47A248' },
  { name: 'Vercel', slug: 'vercel', color: 'ffffff' },
];

const CASE_STUDIES = [
  {
    name: 'CWF',
    sector: 'Ventanas y cancelería',
    result: 'Panel de cotizaciones, conversaciones y CRM en un solo flujo operativo.',
    href: '/cwf-panel/login',
    accent: CYAN,
  },
  {
    name: 'Deco House',
    sector: 'Decoración e interiorismo',
    result: 'Chatbot de diseño con catálogo y seguimiento de proyectos por WhatsApp.',
    href: '/demo/deco-house',
    accent: GOLD,
  },
  {
    name: 'Izzi',
    sector: 'Telecomunicaciones',
    result: 'Captura de leads por campaña con alertas inmediatas al equipo comercial.',
    href: '/izzi/merida',
    accent: '#7C3AED',
  },
  {
    name: 'Biovela',
    sector: 'Cosmética natural',
    result: 'Catálogo digital, contratos y pagos integrados con experiencia de marca.',
    href: '/biovela',
    accent: '#10B981',
  },
];

const TECH_STACK = [
  { label: 'Next.js 14', detail: 'SSR, API routes y PWAs en producción' },
  { label: 'MongoDB Atlas', detail: 'Leads, conversaciones y configuración multi-tenant' },
  { label: 'Meta Cloud API', detail: 'WhatsApp Business y webhooks de Lead Ads' },
  { label: 'Vercel Edge', detail: 'Deploy global con latencia mínima' },
  { label: 'Cloudinary', detail: 'Assets, OG images y medios optimizados' },
  { label: 'Web Push + VAPID', detail: 'Notificaciones sin app nativa' },
];

function GlassCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-12 max-w-2xl">
      <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 font-[family-name:var(--font-inter)] text-base leading-relaxed text-white/55">
        {subtitle}
      </p>
    </div>
  );
}

export function AgentiaLandingPage() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -120]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -60]);

  const waUrl = agentiaWhatsAppUrl(
    'Hola, vengo de agentia.software y quiero conocer cómo automatizar mi negocio.',
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-inter)] text-white"
      style={{ background: BG }}
    >
      <ParticleField />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 15% -5%, rgba(0,212,255,0.14), transparent 50%), radial-gradient(ellipse 50% 35% at 85% 10%, rgba(255,215,0,0.09), transparent 45%)',
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-xl p-0.5 shadow-[0_0_24px_rgba(0,212,255,0.25)]">
              <Image
                src="/logo-agentia-2026.png"
                alt="Agentia"
                width={44}
                height={44}
                className="h-11 w-11 rounded-lg object-contain"
                priority
              />
            </div>
            <span className="hidden font-[family-name:var(--font-space)] text-lg font-bold tracking-wide sm:block">
              Agentia
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#servicios" className="transition hover:text-[#00D4FF]">
              Servicios
            </a>
            <a href="#integraciones" className="transition hover:text-[#00D4FF]">
              Integraciones
            </a>
            <a href="#casos" className="transition hover:text-[#00D4FF]">
              Casos
            </a>
            <a href="#demos" className="transition hover:text-[#00D4FF]">
              Demos
            </a>
          </nav>
          <Link
            href="/login?from=/dashboard"
            className="rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-4 py-2 text-sm font-semibold text-[#00D4FF] transition hover:bg-[#00D4FF]/20"
          >
            Acceso clientes
          </Link>
        </header>

        <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-12 pb-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/10 px-3 py-1.5 text-xs font-semibold text-[#00D4FF]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Software que vende mientras duermes
            </motion.div>

            <h1 className="font-[family-name:var(--font-space)] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Infraestructura digital
              <br />
              para equipos que
              <br />
              <TypewriterHeadline />
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
              Chatbots, CRM, web y automatizaciones con partners oficiales. Un solo equipo, una sola plataforma.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <GlowButton href="/brief">Diagnóstico gratuito</GlowButton>
              <GlowButton href="#demos" variant="secondary">
                Ver demos en vivo
              </GlowButton>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { v: '8+', l: 'servicios integrados' },
                { v: '24/7', l: 'IA activa' },
                { v: '7 días', l: 'a producción' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-[family-name:var(--font-space)] text-2xl font-bold text-[#FFD700]">{s.v}</p>
                  <p className="text-xs text-white/45">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div style={{ y: parallaxY }} className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                className="absolute -inset-8 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.2), transparent 70%)' }}
                aria-hidden
              />
              <HeroPhoneMockup />
            </div>
          </motion.div>
        </section>

        <section id="servicios" className="scroll-mt-24 py-20">
          <SectionTitle
            title="Todo lo que tu operación comercial necesita"
            subtitle="Desde el primer mensaje en WhatsApp hasta el cierre en CRM. Sin parches ni herramientas sueltas."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <GlassCard key={s.title} delay={i * 0.04}>
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/10"
                >
                  <s.icon className="h-5 w-5 text-[#00D4FF]" />
                </div>
                <h3 className="font-[family-name:var(--font-space)] text-base font-bold leading-snug text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="integraciones" className="scroll-mt-24 py-20">
          <motion.div style={{ y: parallaxY2 }}>
            <SectionTitle
              title="Nuestras integraciones"
              subtitle="Conectamos con el ecosistema que ya usan tus clientes y tu equipo técnico."
            />
          </motion.div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {INTEGRATIONS.map((item, i) => (
              <GlassCard key={item.name} delay={i * 0.05} className="flex flex-col items-center justify-center py-8 text-center">
                <img
                  src={`https://cdn.simpleicons.org/${item.slug}/${item.color}`}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                />
                <span className="mt-3 text-xs font-semibold text-white/70">{item.name}</span>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="casos" className="scroll-mt-24 py-20">
          <SectionTitle
            title="Casos de éxito"
            subtitle="Marcas reales con operación en producción. No mockups de pitch deck."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {CASE_STUDIES.map((c, i) => (
              <GlassCard key={c.name} delay={i * 0.06}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.accent }}>
                      {c.sector}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-space)] text-2xl font-bold">{c.name}</h3>
                  </div>
                  <Layers className="h-6 w-6 shrink-0 opacity-40" style={{ color: c.accent }} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{c.result}</p>
                <Link
                  href={c.href}
                  className="mt-5 inline-flex text-sm font-semibold transition hover:opacity-80"
                  style={{ color: c.accent }}
                >
                  Ver proyecto
                </Link>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="tecnologia" className="scroll-mt-24 py-20">
          <SectionTitle
            title="Tecnología que usamos"
            subtitle="Stack moderno, auditable y listo para escalar sin reescribir todo cada trimestre."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map((t, i) => (
              <motion.div
                key={t.label}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.45 }}
                className="flex gap-4 rounded-xl border border-white/8 bg-gradient-to-r from-white/[0.05] to-transparent px-5 py-4"
              >
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD700]" />
                <div>
                  <p className="font-[family-name:var(--font-space)] font-bold text-white">{t.label}</p>
                  <p className="mt-1 text-sm text-white/45">{t.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <div id="demos" className="scroll-mt-24 py-8">
          <IndustrySelectorGrid />
        </div>

        <section className="py-16">
          <GlassCard className="relative overflow-hidden px-6 py-14 text-center sm:px-12">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.15), transparent 60%)',
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-[family-name:var(--font-space)] text-3xl font-extrabold sm:text-4xl">
                ¿Listo para que tu stack
                <br className="hidden sm:block" />
                trabaje como un solo sistema?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/55">
                Agenda una demo o escríbenos por WhatsApp. Respuesta humana, sin bots genéricos en el primer contacto.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <GlowButton href={waUrl} external>
                  WhatsApp {AGENTIA_WHATSAPP_DISPLAY}
                </GlowButton>
                <GlowButton href="/brief" variant="secondary">
                  Brief de proyecto
                </GlowButton>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/40">
                {['Sin permanencia', 'Partners Meta y Tiendanube', 'Soporte en español'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <footer className="border-t border-white/8 pt-10 text-center text-sm text-white/40">
          <p>© {new Date().getFullYear()} Agentia · CRM, chatbots y automatización con IA</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/legal/terminos" className="hover:text-white/70">
              Términos
            </Link>
            <span>·</span>
            <Link href="/legal/privacidad" className="hover:text-white/70">
              Privacidad
            </Link>
            <span>·</span>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#00D4FF]">
              WhatsApp
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
