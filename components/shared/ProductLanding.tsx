'use client';

import '@/styles/agentia-brand.css';
import { useCallback, useState } from 'react';
import { AgentiaChatWidget } from '@/components/AgentiaChatWidget';
import { ParticleField } from '@/components/landing/ParticleField';
import { ModernChatPreview, type ChatLine } from '@/components/landing/ModernChatPreview';
import { ScrollReveal, StaggerItem, StaggerReveal } from '@/components/landing/ScrollReveal';
import { useAnalytics } from '@/src/lib/analytics-client';
import Footer from '@/components/shared/Footer';
import LeadForm from '@/components/shared/LeadForm';
import Navbar from '@/components/shared/Navbar';
import ROICalculator, {
  type ROIField,
  type ROIResultLine,
} from '@/components/shared/ROICalculator';
import WhatsAppFloat from '@/components/shared/WhatsAppFloat';

const BG = '#0a0a0a';
const CYAN = '#00D4FF';

export type ProductCaseCard = {
  nombre: string;
  giro: string;
  detalle: string;
};

export type ProductFeaturedCase = {
  title: string;
  body?: string;
  stats: { value: string; label: string; color: string }[];
};

export type ProductLandingConfig = {
  slug: string;
  analytics: string;
  waLabel: string;
  eyebrow: string;
  headline: string;
  lead: string;
  badge?: string;
  caseCards?: ProductCaseCard[];
  featuredCase?: ProductFeaturedCase;
  differentiatorsTitle: string;
  differentiators: { titulo: string; texto: string }[];
  roiTitle: string;
  roiFields: ROIField[];
  calculateRoi: (values: Record<string, number>) => ROIResultLine[];
  heroChat?: { businessName: string; messages: ChatLine[] };
};

export function ProductLanding({ config }: { config: ProductLandingConfig }) {
  useAnalytics(config.analytics);
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  const onResultChange = useCallback((_: Record<string, number>, r: ROIResultLine[]) => {
    setRoiResult(r);
  }, []);

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden font-[family-name:var(--font-jakarta)] text-white"
      style={{ background: BG }}
    >
      <ParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 20% -5%, rgba(0,212,255,0.14), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 15%, rgba(255,215,0,0.09), transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10">
        <Navbar ctaHref="#diagnostico" ctaLabel="Diagnóstico" ctaExternal={false} />

        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <section className="grid min-h-[calc(100dvh-5.5rem)] items-end gap-10 py-12 lg:grid-cols-12 lg:items-center lg:py-10">
            <div className={config.heroChat ? 'lg:col-span-7' : 'lg:col-span-8'}>
              <p className="mb-4 font-[family-name:var(--font-space)] text-sm font-medium tracking-wide text-[#FFD700]">
                {config.eyebrow}
              </p>
              <h1 className="max-w-[16ch] font-[family-name:var(--font-space)] text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
                {config.headline}
              </h1>
              <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-white/60 sm:text-lg">
                {config.lead}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#diagnostico"
                  className="inline-flex items-center rounded-full bg-[#00D4FF] px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:shadow-[0_0_32px_rgba(0,212,255,0.4)] active:scale-[0.97]"
                >
                  Quiero mi diagnóstico gratis
                </a>
                <a
                  href={config.caseCards || config.featuredCase ? '#casos' : '#capacidad'}
                  className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-[transform,border-color,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-[#00D4FF]/50 hover:bg-white/8 active:scale-[0.97]"
                >
                  {config.caseCards || config.featuredCase ? 'Ver casos reales' : 'Qué incluye'}
                </a>
              </div>
              {config.badge ? (
                <p className="mt-6 inline-flex rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/5 px-3 py-1.5 text-[12px] text-[#7fd7ff]">
                  {config.badge}
                </p>
              ) : null}
            </div>
            {config.heroChat ? (
              <div className="hidden lg:col-span-5 lg:block">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                  <p className="mb-3 text-center text-xs uppercase tracking-widest text-white/40">
                    Conversación simulada
                  </p>
                  <ModernChatPreview
                    businessName={config.heroChat.businessName}
                    accent={CYAN}
                    messages={config.heroChat.messages}
                    animate
                  />
                </div>
              </div>
            ) : null}
          </section>

          {config.caseCards ? (
            <section id="casos" className="scroll-mt-28 py-20 sm:py-24">
              <ScrollReveal>
                <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
                  Negocios que ya lo usan todos los días
                </h2>
              </ScrollReveal>
              <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-2">
                {config.caseCards.map((c) => (
                  <StaggerItem key={c.nombre}>
                    <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[border-color,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-[#00D4FF]/35">
                      <p className="font-[family-name:var(--font-space)] text-lg font-semibold">
                        {c.nombre}
                      </p>
                      <p className="mt-1 font-mono text-[13px]" style={{ color: CYAN }}>
                        {c.giro}
                      </p>
                      <p className="mt-3 text-[15px] text-white/60">{c.detalle}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </section>
          ) : null}

          {config.featuredCase ? (
            <section id="casos" className="scroll-mt-28 py-20 sm:py-24">
              <ScrollReveal>
                <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
                  {config.featuredCase.title}
                </h2>
                {config.featuredCase.body ? (
                  <p className="mt-4 max-w-[65ch] text-white/55">{config.featuredCase.body}</p>
                ) : null}
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-8">
                  <div className="grid gap-8 sm:grid-cols-3">
                    {config.featuredCase.stats.map((s) => (
                      <div key={s.label}>
                        <p
                          className="font-mono text-[1.75rem] font-semibold tabular-nums sm:text-3xl"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </p>
                        <p className="mt-2 text-sm text-white/55">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </section>
          ) : null}

          <section id="capacidad" className="scroll-mt-28 py-20 sm:py-24">
            <ScrollReveal>
              <h2 className="max-w-[18ch] font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
                {config.differentiatorsTitle}
              </h2>
            </ScrollReveal>
            <div className="mt-10 space-y-0">
              {config.differentiators.map((d, i) => (
                <ScrollReveal key={d.titulo} delay={i * 0.05}>
                  <div
                    className={
                      'grid gap-3 border-white/10 py-8 md:grid-cols-12 md:gap-8 ' +
                      (i === 0 ? 'border-t' : '') +
                      ' border-b'
                    }
                  >
                    <p className="font-[family-name:var(--font-space)] text-xl font-semibold md:col-span-5">
                      {d.titulo}
                    </p>
                    <p className="text-[15px] leading-relaxed text-white/60 md:col-span-7">
                      {d.texto}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <section id="diagnostico" className="scroll-mt-28 py-20 sm:py-24">
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <ROICalculator
                title={config.roiTitle}
                fields={config.roiFields}
                calculate={config.calculateRoi}
                onResultChange={onResultChange}
              />
              <LeadForm product={config.slug} roiSnapshot={{ result: roiResult }} />
            </div>
          </section>
        </div>

        <Footer />
      </div>

      <WhatsAppFloat productLabel={config.waLabel} />
      <AgentiaChatWidget />
    </main>
  );
}

export { CYAN };
