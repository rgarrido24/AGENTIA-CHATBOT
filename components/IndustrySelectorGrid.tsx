'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dog,
  Leaf,
  Scissors,
  Shield,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wrench,
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const GIROS: { Icon: LucideIcon; label: string; href: string; imageUrl: string }[] = [
  { Icon: Scissors,        label: 'Barbería',          href: '/demo/barber',      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80' },
  { Icon: Sparkles,        label: 'Nail Studio',        href: '/demo/nailstudio',  imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80' },
  { Icon: UtensilsCrossed, label: 'Restaurante',        href: '/demo/restaurante', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
  { Icon: Waves,           label: 'Spa',                href: '/demo/spa',         imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80' },
  { Icon: Leaf,            label: 'Nutrición',          href: '/demo/nutricion',   imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80' },
  { Icon: Shield,          label: 'Dentista',           href: '/demo/dentista',    imageUrl: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80' },
  { Icon: Stethoscope,     label: 'Médico',             href: '/demo/medico',      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80' },
  { Icon: Wrench,          label: 'Taller',             href: '/demo/taller',      imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=80' },
  { Icon: Wifi,            label: 'Telecomunicaciones', href: '/demo/restaurante', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
  { Icon: Dog,             label: 'Grooming',           href: '/demo/grooming',    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80' },
];

function GiroCard({
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
        className="group relative flex h-32 sm:h-36 flex-col items-center justify-end overflow-hidden rounded-xl p-4 text-center transition-all duration-200"
        style={{
          border: `1px solid ${hovered ? 'rgba(0,212,255,0.55)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: hovered ? '0 0 0 1px rgba(0,212,255,0.18), 0 8px 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Background image — scales on hover via group-hover */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        {/* Dramatic dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/25" />

        {/* Icon + label */}
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

export function IndustrySelectorGrid() {
  return (
    <section className="mb-20">
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-[family-name:var(--font-space)] text-3xl font-bold text-white">
          Demos en vivo por industria
        </h2>
        <p className="text-sm text-white/50">Cada demo es funcional. Pruébala ahora.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GIROS.map(({ Icon, label, href, imageUrl }, i) => (
          <GiroCard key={label} Icon={Icon} label={label} href={href} imageUrl={imageUrl} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}
