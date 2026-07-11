'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

function scrollToSimulator() {
  document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' });
}

const META_APPS = [
  {
    logo: '/logos/meta/whatsapp.svg',
    title: 'WhatsApp Business API',
    desc: 'Mensajería escalable con plantillas y bots certificados.',
    glow: 'rgba(37,211,102,0.25)',
  },
  {
    logo: '/logos/meta/messenger.svg',
    title: 'Facebook Messenger',
    desc: 'Inbox unificado y respuestas automatizadas.',
    glow: 'rgba(160,51,255,0.25)',
  },
  {
    logo: '/logos/meta/instagram.svg',
    title: 'Instagram DM',
    desc: 'Atención en DMs sin perder conversaciones.',
    glow: 'rgba(214,41,118,0.25)',
  },
  {
    logo: '/logos/meta/facebook.svg',
    title: 'Facebook Lead Ads',
    desc: 'Captura desde formularios Meta a tu CRM en tiempo real.',
    glow: 'rgba(24,119,242,0.25)',
  },
] as const;

export function MetaEcosystemSection() {
  return (
    <section id="meta" className="scroll-mt-24 py-16">
      <div className="group/meta relative overflow-hidden rounded-3xl border border-[#1877F2]/30 bg-gradient-to-br from-[#1877F2]/10 via-[#0a0a0a] to-[#00D4FF]/5 p-8 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(24,119,242,0.15), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,212,255,0.1), transparent 40%)',
          }}
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1877F2]/40 bg-[#1877F2]/15 px-4 py-1.5 text-sm font-bold text-[#6CB4FF]">
              Partner Oficial Meta
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-space)] text-3xl font-bold text-white sm:text-4xl">
              Ecosistema Meta
            </h2>
            <p className="mt-3 max-w-xl text-white/60">
              Integramos tu operación con la infraestructura oficial de Meta para mensajería, leads y
              automatización comercial.
            </p>
          </div>
          <Image
            src="/logos/meta/meta.svg"
            alt="Meta"
            width={56}
            height={56}
            className="h-14 w-14"
          />
        </div>

        <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {META_APPS.map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:border-white/25"
              style={{ boxShadow: '0 0 0 transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 28px ${item.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 transparent';
              }}
            >
              <Image src={item.logo} alt="" width={40} height={40} className="mb-3 h-10 w-10" />
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-10 rounded-2xl border border-dashed border-[#FFD700]/35 bg-[#FFD700]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Próximamente</p>
          <h3 className="mt-2 text-lg font-bold text-white">Automatización de Redes Sociales</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Respuesta automática a comentarios, inbox, DMs y nuevos seguidores en Facebook e Instagram.
            Tipo ManyChat pero construido sobre tu infraestructura.
          </p>
          <button
            type="button"
            onClick={scrollToSimulator}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#0a0a0a] transition hover:brightness-110"
          >
            Lista de espera
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
