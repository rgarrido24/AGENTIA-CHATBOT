'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dog,
  Leaf,
  Scissors,
  Shield,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const DEMOS: { Icon: LucideIcon; label: string; href: string; imageUrl: string }[] = [
  {
    Icon: UtensilsCrossed,
    label: 'Restaurante / Café',
    href: '/demos/restaurante',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    Icon: Leaf,
    label: 'Tienda artesanal',
    href: '/demos/biovela',
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&q=80',
  },
  {
    Icon: Shield,
    label: 'Clínica dental',
    href: '/demo/dentista',
    imageUrl: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80',
  },
  {
    Icon: Scissors,
    label: 'Barbería',
    href: '/demo/barber',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  },
  {
    Icon: Wrench,
    label: 'Taller mecánico',
    href: '/demo/taller',
    imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=80',
  },
  {
    Icon: Dog,
    label: 'Estética canina',
    href: '/demo/grooming',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
  },
];

function DemoGiroCard({
  Icon,
  label,
  href,
  imageUrl,
  delay,
}: {
  Icon: LucideIcon;
  label: string;
  href: string;
  imageUrl: string;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex h-32 flex-col items-center justify-end overflow-hidden rounded-xl p-4 text-center transition-all duration-200 sm:h-36"
        style={{
          border: `1px solid ${hovered ? 'rgba(0,212,255,0.55)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: hovered ? '0 0 0 1px rgba(0,212,255,0.18), 0 8px 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/25" />

        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200"
            style={{ background: hovered ? 'rgba(0,212,255,0.18)' : 'rgba(0,0,0,0.45)' }}
          >
            <Icon className="h-5 w-5" style={{ color: '#00D4FF' }} />
          </div>
          <span className="text-[13px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function LiveDemosSection() {
  return (
    <section id="demos" className="scroll-mt-24 py-16">
      <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">
        Demos en vivo
      </h2>
      <p className="mt-3 max-w-2xl text-white/55">
        Cada demo es funcional con datos ficticios. Pruébala ahora.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {DEMOS.map((demo, i) => (
          <DemoGiroCard key={demo.href} {...demo} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}
