'use client';

import { AnimatePresence, motion } from 'framer-motion';

const CONFETTI_COLORS = ['#C9A84C', '#FAF7F2', '#2C1810', '#e8c96a', '#25D366'];

export function fireConfetti() {
  if (typeof document === 'undefined') return;
  const root = document.createElement('div');
  root.className = 'pointer-events-none fixed inset-0 z-[100] overflow-hidden';
  document.body.appendChild(root);

  for (let i = 0; i < 48; i++) {
    const p = document.createElement('div');
    const left = 30 + Math.random() * 40;
    const delay = Math.random() * 0.15;
    const duration = 0.9 + Math.random() * 0.6;
    const size = 6 + Math.random() * 6;
    p.style.cssText = `
      position:absolute;left:${left}%;top:40%;
      width:${size}px;height:${size}px;
      background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation:lealtad-confetti ${duration}s cubic-bezier(0.23,1,0.32,1) ${delay}s forwards;
      --tx:${(Math.random() - 0.5) * 280}px;
      --ty:${-120 - Math.random() * 220}px;
      --rot:${Math.random() * 720}deg;
    `;
    root.appendChild(p);
  }

  window.setTimeout(() => root.remove(), 2200);
}

export function playPointSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    // Audio opcional — silencioso si el navegador bloquea
  }
}

export type PointFloater = { id: number; amount: number; x: number };

export function PointFloaters({ items }: { items: PointFloater[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <AnimatePresence>
        {items.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.85 }}
            animate={{ opacity: 0, y: -72, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.23, 1, 0.32, 1] }}
            className="absolute text-2xl font-bold"
            style={{ left: `${f.x}%`, top: '45%', color: '#C9A84C', textShadow: '0 2px 12px rgba(201,168,76,0.5)' }}
          >
            +{f.amount}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
