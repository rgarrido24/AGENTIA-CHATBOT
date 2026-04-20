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

const GIROS: { Icon: LucideIcon; label: string; href: string }[] = [
  { Icon: Scissors,        label: 'Barbería',          href: '/demo/barber' },
  { Icon: Sparkles,        label: 'Nail Studio',        href: '/demo/barber' },
  { Icon: UtensilsCrossed, label: 'Restaurante',        href: '/demo/restaurante' },
  { Icon: Waves,           label: 'Spa',                href: '/demo/spa' },
  { Icon: Leaf,            label: 'Nutrición',          href: '/demo/nutricion' },
  { Icon: Shield,          label: 'Dentista',           href: '/demo/dentista' },
  { Icon: Stethoscope,     label: 'Médico',             href: '/demo/medico' },
  { Icon: Wrench,          label: 'Taller',             href: '/demo/taller' },
  { Icon: Wifi,            label: 'Telecomunicaciones', href: '/demo/restaurante' },
  { Icon: Dog,             label: 'Grooming',           href: '/demo/grooming' },
];

function GiroCard({ Icon, label, href, delay }: { Icon: LucideIcon; label: string; href: string; delay: number }) {
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
        className="flex flex-col items-center gap-2.5 rounded-xl p-5 text-center transition-all duration-200"
        style={{
          background: hovered ? 'rgba(34,197,94,0.05)' : '#111',
          border: `0.5px solid ${hovered ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{ background: hovered ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.06)' }}
        >
          <Icon className="w-6 h-6" style={{ color: '#22c55e' }} />
        </div>
        <span className="text-white text-[13px] font-medium leading-tight">{label}</span>
      </Link>
    </motion.div>
  );
}

export function IndustrySelectorGrid() {
  return (
    <section className="mb-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Elige tu industria</h2>
        <p className="text-slate-400 text-sm">Cada demo es funcional — pruébala ahora</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {GIROS.map(({ Icon, label, href }, i) => (
          <GiroCard key={label} Icon={Icon} label={label} href={href} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}
