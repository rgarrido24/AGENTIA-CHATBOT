'use client';

import { useCallback, useState } from 'react';
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

const BG = '#FAFAF8';
const INK = '#14161A';
const BRONZE = '#B8935A';

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

function statColor(index: number) {
  return index === 1 ? INK : BRONZE;
}

export function ProductLanding({ config }: { config: ProductLandingConfig }) {
  useAnalytics(config.analytics);
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  const onResultChange = useCallback((_: Record<string, number>, r: ROIResultLine[]) => {
    setRoiResult(r);
  }, []);

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden antialiased" style={{ background: BG, color: INK }}>
      <Navbar theme="light" ctaHref="#diagnostico" ctaLabel="Diagnóstico" ctaExternal={false} />

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <section className="grid items-end gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:items-center">
          <div className={config.heroChat ? 'lg:col-span-7' : 'lg:col-span-8'}>
            <p className="mb-4 text-sm font-medium tracking-wide" style={{ color: BRONZE }}>
              {config.eyebrow}
            </p>
            <h1 className="max-w-[16ch] text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {config.headline}
            </h1>
            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-[#14161A]/60 sm:text-lg">
              {config.lead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#diagnostico"
                className="inline-flex items-center rounded-full bg-[#14161A] px-6 py-3.5 text-sm font-semibold text-[#FAFAF8] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px active:scale-[0.97]"
              >
                Quiero mi diagnóstico gratis
              </a>
              <a
                href={config.caseCards || config.featuredCase ? '#casos' : '#capacidad'}
                className="inline-flex items-center rounded-full border border-[#14161A]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#14161A] transition-[transform,border-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-[#14161A]/30 active:scale-[0.97]"
              >
                {config.caseCards || config.featuredCase ? 'Ver casos reales' : 'Qué incluye'}
              </a>
            </div>
            {config.badge ? (
              <p className="mt-6 inline-flex rounded-full border border-[#B8935A]/35 bg-[#B8935A]/8 px-3 py-1.5 text-[12px] text-[#8A6B3E]">
                {config.badge}
              </p>
            ) : null}
          </div>
          {config.heroChat ? (
            <div className="hidden lg:col-span-5 lg:block">
              <div className="rounded-2xl border border-[#14161A]/10 bg-white p-5 shadow-[0_16px_40px_rgba(20,22,26,0.06)]">
                <p className="mb-3 text-center text-xs uppercase tracking-widest text-[#14161A]/40">
                  Conversación simulada
                </p>
                <ModernChatPreview
                  businessName={config.heroChat.businessName}
                  accent={BRONZE}
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
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Negocios que ya lo usan todos los días
              </h2>
            </ScrollReveal>
            <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-2">
              {config.caseCards.map((c) => (
                <StaggerItem key={c.nombre}>
                  <div className="h-full rounded-2xl border border-[#14161A]/8 bg-white p-6 shadow-[0_8px_24px_rgba(20,22,26,0.04)] transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5">
                    <p className="text-lg font-semibold">{c.nombre}</p>
                    <p className="mt-1 text-[13px] font-medium" style={{ color: BRONZE }}>
                      {c.giro}
                    </p>
                    <p className="mt-3 text-[15px] text-[#14161A]/60">{c.detalle}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </section>
        ) : null}

        {config.featuredCase ? (
          <section id="casos" className="scroll-mt-28 py-20 sm:py-24">
            <ScrollReveal>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {config.featuredCase.title}
              </h2>
              {config.featuredCase.body ? (
                <p className="mt-4 max-w-[65ch] text-[#14161A]/55">{config.featuredCase.body}</p>
              ) : null}
              <div className="mt-8 overflow-hidden rounded-2xl border border-[#14161A]/8 bg-white p-6 shadow-[0_8px_24px_rgba(20,22,26,0.04)] sm:p-8">
                <div className="grid gap-8 sm:grid-cols-3">
                  {config.featuredCase.stats.map((s, i) => (
                    <div key={s.label}>
                      <p
                        className="text-[1.75rem] font-semibold tabular-nums sm:text-3xl"
                        style={{ color: statColor(i) }}
                      >
                        {s.value}
                      </p>
                      <p className="mt-2 text-sm text-[#14161A]/55">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </section>
        ) : null}

        <section id="capacidad" className="scroll-mt-28 py-20 sm:py-24">
          <ScrollReveal>
            <h2 className="max-w-[18ch] text-3xl font-bold tracking-tight sm:text-4xl">
              {config.differentiatorsTitle}
            </h2>
          </ScrollReveal>
          <div className="mt-10 space-y-0">
            {config.differentiators.map((d, i) => (
              <ScrollReveal key={d.titulo} delay={i * 0.05}>
                <div
                  className={
                    'grid gap-3 border-[#14161A]/10 py-8 md:grid-cols-12 md:gap-8 ' +
                    (i === 0 ? 'border-t' : '') +
                    ' border-b'
                  }
                >
                  <p className="text-xl font-semibold md:col-span-5">{d.titulo}</p>
                  <p className="text-[15px] leading-relaxed text-[#14161A]/60 md:col-span-7">
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
      <WhatsAppFloat productLabel={config.waLabel} />
    </main>
  );
}

export { BRONZE };
