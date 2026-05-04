'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Sparkles, Zap } from 'lucide-react';

const DEMO_TEXT =
  'Hola Rodolfo, vengo de redes. Quiero ver cómo Agentia automatiza mi negocio';

function digitsOnly(s: string) {
  return String(s || '').replace(/\D/g, '');
}

function buildWhatsAppUrl(phoneDigits: string) {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  const text = encodeURIComponent(DEMO_TEXT);
  return `https://wa.me/${d}?text=${text}`;
}

function useAnimatedLeadsToday(seed: number) {
  const [display, setDisplay] = useState(0);
  const target = useMemo(() => 1800 + (seed % 1200), [seed]);

  useEffect(() => {
    const start = performance.now();
    const duration = 2200;
    let raf = 0;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(Math.floor(easeOutCubic(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  useEffect(() => {
    const id = window.setInterval(
      () => setDisplay((n) => n + Math.floor(Math.random() * 4) + 1),
      11000 + Math.floor(Math.random() * 7000)
    );
    return () => window.clearInterval(id);
  }, []);

  return display;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
};

const containerReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
};

const itemReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

export function ReadyLanding({ whatsappDigits }: { whatsappDigits: string }) {
  const reduceMotion = useReducedMotion();
  const seed = useMemo(() => Math.floor(Date.now() / 86_400_000) % 10_000, []);
  const leads = useAnimatedLeadsToday(seed);
  const waUrl = buildWhatsAppUrl(whatsappDigits);

  const onDemoClick = useCallback(() => {
    if (!waUrl) return;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [waUrl]);

  const parentMotion = reduceMotion
    ? { initial: false, animate: 'show' as const, variants: containerReduced }
    : { initial: 'hidden' as const, animate: 'show' as const, variants: container };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#030508] text-white">
      {/* Fondo: gradiente + malla (sin imagen pesada — LCP rápido) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 255, 180, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.12), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(168, 85, 247, 0.1), transparent 45%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-4xl flex-col justify-center px-5 py-16 sm:px-8">
        <motion.div {...parentMotion} className="flex flex-col items-center text-center">
          <motion.div
            variants={item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90 backdrop-blur-xl"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Lanzamiento Agentia
          </motion.div>

          <motion.h1
            variants={reduceMotion ? itemReduced : item}
            className="max-w-3xl text-balance font-[family-name:var(--font-montserrat)] text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Deja de ser el esclavo de tu{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-white to-cyan-300 bg-clip-text text-transparent">
              WhatsApp
            </span>
            .
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-pretty text-base text-zinc-400 sm:text-lg"
          >
            Tu negocio responde 24/7, agenda, cobra y da seguimiento — sin que vivas pegado al celular.
          </motion.p>

          {/* Social proof — glass */}
          <motion.div
            variants={reduceMotion ? itemReduced : item}
            className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Zap className="h-4 w-4 text-amber-400" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">Social proof</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">Leads gestionados hoy por IA</p>
            <p
              className="mt-3 font-[family-name:var(--font-montserrat)] text-4xl font-black tabular-nums tracking-tight text-white sm:text-5xl"
              aria-live="polite"
            >
              {leads.toLocaleString('es-MX')}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Simulación animada para campaña de lanzamiento.</p>
          </motion.div>

          {/* Lead magnet */}
          <motion.div
            variants={reduceMotion ? itemReduced : item}
            className="mt-10 flex w-full max-w-md flex-col items-center gap-3"
          >
            <button
              type="button"
              onClick={onDemoClick}
              disabled={!waUrl}
              className="group relative w-full overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 px-6 py-4 text-base font-bold text-black shadow-[0_0_40px_-8px_rgba(52,211,153,0.55)] transition hover:border-emerald-300/60 hover:shadow-[0_0_48px_-6px_rgba(52,211,153,0.7)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                Ver Demo en Vivo (WhatsApp)
              </span>
              <span
                className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-white/25 transition group-hover:translate-x-[100%] duration-700"
                aria-hidden
              />
            </button>
            {!waUrl && (
              <p className="text-center text-xs text-amber-200/90">
                Configura <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_READY_WHATSAPP_NUMBER</code> o{' '}
                <code className="rounded bg-white/10 px-1 py-0.5">RODOLFO_WHATSAPP</code> en el servidor.
              </p>
            )}
          </motion.div>

          {/* Logo opcional — lazy, pequeño */}
          <motion.div variants={reduceMotion ? itemReduced : item} className="mt-14 opacity-60">
            <Image
              src="/og-agentia.jpg.jpeg"
              alt="Agentia"
              width={160}
              height={84}
              className="h-auto w-32 rounded-lg object-cover opacity-80 ring-1 ring-white/10"
              sizes="128px"
              loading="lazy"
              quality={60}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
