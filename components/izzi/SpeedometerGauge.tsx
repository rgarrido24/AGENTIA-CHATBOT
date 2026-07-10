'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SpeedometerGauge({ target = 100 }: { target?: number }) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const total = 90;
    const id = window.setInterval(() => {
      frame += 1;
      const t = frame / total;
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (frame >= total) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [reduceMotion, target]);

  const angle = -135 + (value / target) * 270;
  const r = 88;
  const cx = 110;
  const cy = 110;

  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(0,177,64,0.35) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <svg viewBox="0 0 220 220" className="relative h-full w-full">
        <defs>
          <linearGradient id="izzi-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B140" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="413"
          strokeDashoffset="103"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#izzi-gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="413"
          initial={{ strokeDashoffset: 413 }}
          animate={{ strokeDashoffset: 413 - (value / target) * 310 }}
          transition={{ duration: 0.15, ease: 'linear' }}
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,177,64,0.6))' }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + 62 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + 62 * Math.sin((angle * Math.PI) / 180)}
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="8" fill="#0a0a0a" stroke="#00B140" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <motion.span
          key={value}
          className="font-mono text-5xl font-black tabular-nums tracking-tighter text-white"
          initial={reduceMotion ? false : { scale: 0.92, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value}
        </motion.span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#00B140]">Mbps</span>
      </div>
    </div>
  );
}
