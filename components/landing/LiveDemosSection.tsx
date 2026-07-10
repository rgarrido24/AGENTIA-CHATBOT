'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ModernChatPreview, type ChatLine } from '@/components/landing/ModernChatPreview';

const DEMOS: {
  href: string;
  label: string;
  accent: string;
  messages: ChatLine[];
}[] = [
  {
    href: '/demos/chowak',
    label: 'Restaurante / Café',
    accent: '#FF6B35',
    messages: [
      { from: 'bot', text: '¡Hola! ¿Reserva o pedido a domicilio?' },
      { from: 'user', text: 'Mesa para 4 hoy 9pm' },
      { from: 'bot', text: 'Listo. Mesa confirmada. ¿Te mando el menú del chef?' },
    ],
  },
  {
    href: '/demos/biovela',
    label: 'Tienda artesanal',
    accent: '#FF85A1',
    messages: [
      { from: 'user', text: '¿Tienen velas de soya en stock?' },
      { from: 'bot', text: 'Sí, 12 aromas disponibles. Te comparto catálogo y link de pago.' },
      { from: 'user', text: 'Mándame 3 de lavanda' },
    ],
  },
  {
    href: '/demo/dentista',
    label: 'Clínica dental',
    accent: '#00B4D8',
    messages: [
      { from: 'bot', text: 'Buenos días. ¿Agendamos limpieza o valoración?' },
      { from: 'user', text: 'Valoración para mi hija' },
      { from: 'bot', text: 'Jueves 4pm disponible. Recordatorio 24h antes.' },
    ],
  },
  {
    href: '/demo/barber',
    label: 'Barbería',
    accent: '#00D4FF',
    messages: [
      { from: 'bot', text: 'Hola Carlos. ¿Mismo corte con Fernando mañana 11am?' },
      { from: 'user', text: 'Sí, confirmo' },
      { from: 'bot', text: 'Agendado. Te aviso 1h antes.' },
    ],
  },
  {
    href: '/demo/taller',
    label: 'Taller mecánico',
    accent: '#FFD700',
    messages: [
      { from: 'user', text: '¿Ya está mi Jetta?' },
      { from: 'bot', text: 'Frenos listos. Total $4,200. ¿Pasas hoy antes de las 6?' },
      { from: 'user', text: 'Voy en 30 min' },
    ],
  },
  {
    href: '/demo/grooming',
    label: 'Estética canina',
    accent: '#7B2FBE',
    messages: [
      { from: 'bot', text: '¡Hola! Baño + corte para Luna el sábado 10am?' },
      { from: 'user', text: 'Perfecto' },
      { from: 'bot', text: 'Reserva confirmada. Recuerda traer su cartilla.' },
    ],
  },
];

export function LiveDemosSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="demos" className="scroll-mt-24 py-16">
      <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
        Demos en vivo
      </h2>
      <p className="mt-3 max-w-2xl text-white/55">
        SaaS funcionales con datos ficticios. Explora conversaciones reales simuladas en cada industria.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMOS.map((demo, i) => (
          <motion.article
            key={demo.href}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ y: -4 }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-shadow hover:shadow-[0_0_40px_rgba(0,212,255,0.12)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">{demo.label}</h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${demo.accent}22`, color: demo.accent }}
              >
                Demo
              </span>
            </div>

            <div className="relative mx-auto max-w-[240px]">
              <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-b from-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative rounded-[22px] border border-white/15 bg-[#1a1a1a] p-2 shadow-2xl">
                <div className="mb-1 flex justify-center">
                  <div className="h-1 w-12 rounded-full bg-white/20" />
                </div>
                <ModernChatPreview
                  businessName={demo.label.split(' ')[0]}
                  accent={demo.accent}
                  messages={demo.messages}
                  animate={hovered === i}
                  compact
                />
              </div>
            </div>

            <Link
              href={demo.href}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-[#00D4FF]/30 py-2.5 text-sm font-semibold text-[#00D4FF] transition hover:bg-[#00D4FF]/10"
            >
              Probar demo →
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
