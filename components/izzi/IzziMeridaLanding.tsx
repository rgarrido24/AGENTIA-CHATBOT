'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IzziLogo } from '@/components/IzziLogo';
import { OfferCountdown } from '@/components/izzi/OfferCountdown';
import { SpeedometerGauge } from '@/components/izzi/SpeedometerGauge';
import { WhatsAppPromoPopup } from '@/components/izzi/WhatsAppPromoPopup';
import { WifiSignalField } from '@/components/izzi/WifiSignalField';
import { IZZI_MERIDA_WA, IZZI_PLAN } from '@/lib/izzi-brand';

const STORAGE_KEY = 'izzi_merida_cupos_v3';
const CUPOS_START = 7;
const CUPOS_MIN = 2;

const BENEFITS = [
  {
    image:
      'https://upload.wikimedia.org/wikipedia/commons/7/7a/Logonetflix.png',
    imageAlt: 'Netflix',
    isLogo: true,
    title: 'Netflix sin buffering',
    desc: '4K en varios dispositivos a la vez',
  },
  {
    image:
      'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=240&h=240&fit=crop&q=80',
    imageAlt: 'Trabajo remoto',
    isLogo: false,
    title: 'Trabajo remoto fluido',
    desc: 'Videollamadas y nube sin cortes',
  },
  {
    image:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=240&h=240&fit=crop&q=80',
    imageAlt: 'Gaming',
    isLogo: false,
    title: 'Gaming competitivo',
    desc: 'Ping bajo para jugar en línea',
  },
  {
    image:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=240&h=240&fit=crop&q=80',
    imageAlt: 'Familia conectada',
    isLogo: false,
    title: 'Toda la familia conectada',
    desc: 'Celulares, tablets y smart TV',
  },
] as const;

function randomIntervalMs() {
  return (8 + Math.floor(Math.random() * 5)) * 60 * 1000;
}

function reconcileCupos(): number {
  const now = Date.now();
  let n = CUPOS_START;
  let nextAt = now + randomIntervalMs();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { n?: number; nextAt?: number };
      if (typeof p.n === 'number' && typeof p.nextAt === 'number') {
        n = Math.min(CUPOS_START, Math.max(CUPOS_MIN, Math.round(p.n)));
        nextAt = p.nextAt;
        while (now >= nextAt && n > CUPOS_MIN) {
          n -= 1;
          nextAt += randomIntervalMs();
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ n, nextAt }));
  } catch {
    /* ignore */
  }
  return n;
}

export function IzziMeridaLanding() {
  const reduceMotion = useReducedMotion();
  const [cupos, setCupos] = useState(CUPOS_START);
  const [pulseCta, setPulseCta] = useState(true);

  useEffect(() => {
    setCupos(reconcileCupos());
    const id = window.setInterval(() => setCupos(reconcileCupos()), 30_000);
    const pulse = window.setInterval(() => setPulseCta((p) => !p), 2000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(pulse);
    };
  }, []);

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
      };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#030303] text-white antialiased">
      <WifiSignalField />
      <WhatsAppPromoPopup />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,177,64,0.18), transparent 55%), radial-gradient(ellipse 40% 30% at 90% 80%, rgba(244,114,182,0.12), transparent 50%)',
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 pb-28 pt-8 sm:max-w-xl sm:px-6 sm:pt-12">
        <motion.header
          className="flex flex-col items-center text-center"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <IzziLogo className="h-12 sm:h-14" />
          <motion.span
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#00B140]/35 bg-[#00B140]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#00B140]"
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      '0 0 0 rgba(0,177,64,0)',
                      '0 0 24px rgba(0,177,64,0.35)',
                      '0 0 0 rgba(0,177,64,0)',
                    ],
                  }
            }
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Zap className="h-3.5 w-3.5" />
            Solo Mérida · Oferta limitada
          </motion.span>
        </motion.header>

        <motion.section className="mt-10" {...fadeUp}>
          <h1 className="text-center text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {IZZI_PLAN.name}
          </h1>
          <p className="mt-2 text-center text-sm text-white/55">
            Velocidad simétrica para tu hogar en Mérida
          </p>
          <div className="mt-6">
            <SpeedometerGauge target={IZZI_PLAN.speedMbps} />
          </div>
        </motion.section>

        <motion.section
          className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl"
          {...fadeUp}
        >
          <div className="rounded-[calc(1.75rem-0.25rem)] bg-black/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#f472b6]">
              Precio especial · instalación sin costo
            </p>

            <div className="mt-5 text-center">
              <p className="text-sm font-medium text-white/50">1er mes</p>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-[#f472b6]">$</span>
                <span className="text-6xl font-black tabular-nums tracking-tighter text-white sm:text-7xl">
                  {IZZI_PLAN.firstMonthPrice}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-white/55">Mes 2 y 3</span>
                <span className="text-lg font-bold tabular-nums text-white">
                  ${IZZI_PLAN.months2and3Price}
                  <span className="text-sm font-medium text-white/45">/mes</span>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-white/55">Del 4.º en adelante</span>
                <span className="text-lg font-bold tabular-nums text-white/70">
                  ${IZZI_PLAN.normalPrice}
                  <span className="text-sm font-medium text-white/45">/mes</span>
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="mt-8" {...fadeUp}>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            La oferta termina en
          </p>
          <OfferCountdown />
          <p className="mt-3 text-center text-xs text-white/40">
            Quedan{' '}
            <span className="font-bold text-[#f472b6] tabular-nums">{cupos}</span> cupos con
            instalación 24h
          </p>
        </motion.section>

        <motion.section className="mt-10 grid gap-3 sm:grid-cols-2" {...fadeUp}>
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-500 hover:border-white/20 hover:bg-white/[0.06]"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
            >
              <div className="relative h-24 w-full overflow-hidden bg-black/40">
                {b.isLogo ? (
                  <div className="flex h-full items-center justify-center bg-[#141414] px-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={b.imageAlt}
                      className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={b.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent" />
                  </>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold text-white">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        <motion.div className="mt-10 hidden sm:block" {...fadeUp}>
          <a
            href={IZZI_MERIDA_WA}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-lg font-extrabold text-white shadow-[0_0_40px_rgba(37,211,102,0.35)] transition duration-500 hover:scale-[1.02] hover:shadow-[0_0_56px_rgba(37,211,102,0.5)] active:scale-[0.98]"
          >
            <MessageCircle className="h-6 w-6" />
            Contratar ahora por WhatsApp
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-0.5">
              →
            </span>
          </a>
          <p className="mt-3 text-center text-xs text-white/40">
            Respuesta en minutos · Sin llamadas de venta
          </p>
        </motion.div>
      </div>

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#030303]/90 p-4 backdrop-blur-xl sm:hidden"
        initial={reduceMotion ? false : { y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <a
          href={IZZI_MERIDA_WA}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-extrabold text-white transition active:scale-[0.98]"
          style={{
            background: '#25D366',
            boxShadow: pulseCta
              ? '0 0 32px rgba(37,211,102,0.55)'
              : '0 0 16px rgba(37,211,102,0.25)',
          }}
        >
          <MessageCircle className="h-5 w-5" />
          Contratar ahora
        </a>
      </motion.div>
    </div>
  );
}
