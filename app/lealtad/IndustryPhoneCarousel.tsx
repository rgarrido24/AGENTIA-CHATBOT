'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const CARDS = [
  {
    id: 'cafe',
    label: 'Cafetería',
    brand: 'Café Luna',
    customer: 'Sofía Reyes',
    progress: '7 de 10 visitas',
    reward: '🎁 Café gratis',
    gradient: 'linear-gradient(160deg,#2a2a2a 0%,#121212 45%,#0a0a0a 100%)',
    logoSrc: '/images/mockups/cafe-luna-logo.jpg',
    emoji: '☕',
  },
  {
    id: 'barber',
    label: 'Barbería',
    brand: 'Navaja Norte',
    customer: 'Diego Cetz',
    progress: '7 de 10 cortes',
    reward: '🎁 Corte gratis',
    gradient: 'linear-gradient(160deg,#1E293B 0%,#0F172A 55%,#020617 100%)',
    emoji: '💈',
  },
  {
    id: 'vet',
    label: 'Veterinaria',
    brand: 'Patitas Felices',
    customer: 'Ana Ruiz',
    progress: '4 de 6 consultas',
    reward: '🎁 Desparasitación',
    gradient: 'linear-gradient(160deg,#1e3a5f 0%,#0b1220 100%)',
    emoji: '🐶',
  },
  {
    id: 'taco',
    label: 'Taquería',
    brand: 'El Trompo',
    customer: 'Luis Mena',
    progress: '8 de 10 órdenes',
    reward: '🎁 Orden gratis',
    gradient: 'linear-gradient(160deg,#7c2d12 0%,#431407 100%)',
    emoji: '🌮',
  },
  {
    id: 'gym',
    label: 'Gimnasio',
    brand: 'Fuerza Local',
    customer: 'Maya Solís',
    progress: '12 de 15 check-ins',
    reward: '🎁 Semana gratis',
    gradient: 'linear-gradient(160deg,#3b1d4a 0%,#12081a 100%)',
    emoji: '🏋️',
  },
] as const;

/** Mini-teléfono que cicla tarjetas por giro (pausa fuera de viewport). */
export function IndustryPhoneCarousel() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % CARDS.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  const card = CARDS[index];

  return (
    <div ref={rootRef} className="mx-auto mb-10 flex max-w-lg flex-col items-center sm:mb-12">
      <p className="mb-4 text-center text-sm text-white/45">
        Así se ve la tarjeta en cada giro
      </p>
      <div className="w-full max-w-[240px] rounded-[1.75rem] border border-white/15 bg-[#111] p-2 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.85)]">
        <div className="overflow-hidden rounded-[1.35rem] bg-[#0a0a0a] px-2.5 pb-3 pt-2">
          <div className="mb-2 flex justify-center">
            <div className="h-1.5 w-14 rounded-full bg-white/15" />
          </div>

          <div
            key={card.id}
            className="overflow-hidden rounded-2xl p-3.5 text-white transition-opacity duration-400"
            style={{
              background: card.gradient,
              opacity: 1,
              transitionProperty: reduceMotion ? 'none' : 'opacity',
            }}
          >
            <div className="flex items-center gap-2.5">
              {'logoSrc' in card && card.logoSrc ? (
                <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F5F0E8]">
                  <Image
                    src={card.logoSrc}
                    alt={card.brand}
                    width={48}
                    height={48}
                    className="h-[118%] w-[118%] max-w-none object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                  {card.emoji}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-space)] text-sm font-bold">
                  {card.brand}
                </p>
                <p className="text-[10px] text-white/50">{card.customer}</p>
              </div>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-white/40">
              {card.progress}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-[#00D4FF] to-[#FFD700]" />
            </div>
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold">
              {card.reward}
            </p>
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {CARDS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-label={c.label}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                  i === index ? 'w-4 bg-[#00D4FF]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-white/40">
        {card.emoji} {card.label}
      </p>
    </div>
  );
}
