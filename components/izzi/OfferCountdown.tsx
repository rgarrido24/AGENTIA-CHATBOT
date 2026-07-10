'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const OFFER_END = new Date('2026-07-31T23:59:59');

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function OfferCountdown() {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, OFFER_END.getTime() - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const units = [
    { label: 'Días', value: left.d, key: 'd' },
    { label: 'Hrs', value: left.h, key: 'h' },
    { label: 'Min', value: left.m, key: 'm' },
    { label: 'Seg', value: left.s, key: 's' },
  ];

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {units.map((u) => (
        <div
          key={u.key}
          className="min-w-[56px] rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-sm"
        >
          <div className="rounded-[10px] bg-white/[0.04] px-2 py-2 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <motion.p
              key={`${u.key}-${u.value}`}
              className="font-mono text-xl font-bold tabular-nums text-white sm:text-2xl"
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              {pad(u.value)}
            </motion.p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">{u.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
