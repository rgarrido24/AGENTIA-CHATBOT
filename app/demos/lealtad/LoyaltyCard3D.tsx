'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { COLORS, progressToNextReward, type LoyaltyCustomer } from '@/lib/loyalty-restaurant';

const LOGO = '/logos/masa-madre-logo.jpg';
const EASE = [0.23, 1, 0.32, 1] as const;

function AnimatedPoints({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const spring = useSpring(reduceMotion ? value : 0, { stiffness: 55, damping: 18 });
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v: number) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  return <span className={className}>{display}</span>;
}

export function LoyaltyCard3D({ customer }: { customer: LoyaltyCustomer }) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const [logoOk, setLogoOk] = useState(true);

  const { target, percent, remaining } = progressToNextReward(customer.puntos);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative mx-auto w-full max-w-[380px] [perspective:1200px]"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <motion.div
        className="loyalty-card-gradient relative overflow-hidden rounded-[1.75rem] p-6 shadow-2xl"
        style={{
          rotateX: reduceMotion ? 0 : rotateX,
          rotateY: reduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          border: `1px solid ${COLORS.gold}66`,
        }}
      >
        <div className="loyalty-card-shimmer pointer-events-none absolute inset-0 z-10" aria-hidden />

        <div className="relative z-20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">
                Tarjeta de lealtad
              </p>
              {logoOk ? (
                <Image
                  src={LOGO}
                  alt="Masa Madre"
                  width={160}
                  height={48}
                  className="mt-2 h-10 w-auto object-contain object-left brightness-110"
                  onError={() => setLogoOk(false)}
                  priority
                />
              ) : (
                <p className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-light tracking-[0.12em] text-[#FAF7F2]">
                  MASA MADRE
                </p>
              )}
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold"
              style={{ borderColor: `${COLORS.gold}55`, color: COLORS.gold }}
            >
              VIP
            </div>
          </div>

          <div className="mt-8">
            <p className="font-[family-name:var(--font-playfair)] text-lg font-medium italic text-white/75">
              {customer.nombre}
            </p>
            <p className="mt-2 flex items-baseline gap-2" style={{ color: COLORS.gold }}>
              <AnimatedPoints
                value={customer.puntos}
                className="font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-none"
              />
              <span className="text-lg font-medium text-white/50">pts</span>
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex justify-between text-[11px] text-white/55">
              <span>Próximo: {target.emoji} {target.label}</span>
              <span>{remaining} pts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/35">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.gold}, #f0d78a, ${COLORS.gold})`,
                  backgroundSize: '200% 100%',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
              />
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] uppercase tracking-wider text-white/35">
            $10 MXN = 1 punto · Canje en mostrador
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
