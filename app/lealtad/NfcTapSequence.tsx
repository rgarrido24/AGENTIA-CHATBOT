'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

type Phase = 'idle' | 'approach' | 'flash' | 'reviews' | 'stars' | 'done';

/**
 * Secuencia NFC: teléfono → toque → Google Reviews → estrellas → recompensa.
 * Corre una sola vez al entrar en viewport.
 */
export function NfcTapSequence() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(reduceMotion ? 'done' : 'idle');
  const [stars, setStars] = useState(reduceMotion ? 5 : 0);
  const started = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setPhase('done');
      setStars(5);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const timers: number[] = [];
        setPhase('approach');
        timers.push(window.setTimeout(() => setPhase('flash'), 900));
        timers.push(window.setTimeout(() => setPhase('reviews'), 1300));
        timers.push(
          window.setTimeout(() => {
            setPhase('stars');
            for (let i = 1; i <= 5; i++) {
              timers.push(window.setTimeout(() => setStars(i), i * 280));
            }
          }, 1600),
        );
        timers.push(window.setTimeout(() => setPhase('done'), 1600 + 5 * 280 + 200));

        // Cleanup if unmounted mid-sequence
        (el as HTMLElement & { __nfcTimers?: number[] }).__nfcTimers = timers;
      },
      { threshold: 0.35 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      const timers = (el as HTMLElement & { __nfcTimers?: number[] }).__nfcTimers;
      timers?.forEach((t) => window.clearTimeout(t));
    };
  }, [reduceMotion]);

  const phoneNear = phase !== 'idle';
  const showFlash = phase === 'flash';
  const showReviews = phase === 'reviews' || phase === 'stars' || phase === 'done';
  const showReward = phase === 'done' || (reduceMotion && true);

  return (
    <div
      ref={rootRef}
      className="relative mx-auto flex h-[300px] w-full max-w-[360px] items-center justify-center sm:h-[320px]"
    >
      {/* Tarjeta física NFC */}
      <div
        className="absolute left-[8%] top-1/2 z-10 h-[140px] w-[220px] -translate-y-1/2 overflow-hidden rounded-2xl border border-white/20 sm:h-[152px] sm:w-[240px]"
        style={{
          background: 'linear-gradient(145deg, #1a1f2a 0%, #0c1018 50%, #151a24 100%)',
          boxShadow: '0 16px 32px -16px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            <p className="font-[family-name:var(--font-space)] text-[9px] uppercase tracking-[0.14em] text-[#00D4FF]">
              Agentia
            </p>
            <p className="mt-1 font-[family-name:var(--font-space)] text-base font-bold text-white">
              Tarjeta Inteligente
            </p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-[10px] text-white/45">NFC · un toque</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[10px] text-[#00D4FF]">
              NFC
            </div>
          </div>
        </div>
      </div>

      {/* Teléfono acercándose */}
      <div
        className="absolute z-20"
        style={{
          right: '6%',
          top: '18%',
          transform: phoneNear ? 'translateX(0) rotate(-8deg)' : 'translateX(36px) rotate(-14deg)',
          transitionDuration: reduceMotion ? '0ms' : '900ms',
          transitionProperty: 'transform',
          transitionTimingFunction: 'ease-out',
          willChange: phoneNear && phase === 'approach' ? 'transform' : 'auto',
        }}
      >
        <div className="h-[200px] w-[100px] rounded-[1.35rem] border border-white/25 bg-[#111] p-[6px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.85)] sm:h-[220px] sm:w-[110px]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[1.05rem] bg-[#0a0a0a]">
            <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-white/15" />

            {!showReviews ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
                <div className="h-8 w-8 rounded-full border border-white/15 bg-white/5" />
                <div className="h-1.5 w-12 rounded bg-white/10" />
              </div>
            ) : (
              <div className="flex flex-1 flex-col px-2.5 pb-3 pt-3">
                <p className="text-center text-[8px] font-semibold text-white/50">Google Reviews</p>
                <p className="mt-1 text-center font-[family-name:var(--font-space)] text-[10px] font-bold text-white">
                  Café Luna
                </p>
                <div className="mt-3 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-[14px] leading-none transition-opacity duration-200"
                      style={{
                        opacity: i < stars ? 1 : 0.25,
                        color: i < stars ? '#FBBF24' : '#666',
                        transitionProperty: reduceMotion ? 'none' : 'opacity, color',
                      }}
                      aria-hidden
                    >
                      ★
                    </span>
                  ))}
                </div>
                {(showReward || stars >= 5) && (
                  <div
                    className="mt-auto rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-1.5 py-1.5 text-center transition-opacity duration-300"
                    style={{ opacity: showReward || stars >= 5 ? 1 : 0 }}
                  >
                    <p className="text-[8px] font-semibold text-white">Gracias por tu reseña</p>
                    <p className="mt-0.5 text-[9px] font-bold text-[#25D366]">+20 puntos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Destello breve */}
      <div
        className="pointer-events-none absolute left-[42%] top-[48%] z-30 text-lg transition-opacity duration-200"
        style={{
          opacity: showFlash ? 1 : 0,
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden
      >
        ✨
      </div>
    </div>
  );
}
