'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const SNIPPETS = [
  'await bot.reply(lead)',
  'crm.sync(meta_lead)',
  'push.notify(asesora)',
  'ocr.parse(ine)',
  'zapier.trigger()',
  'wa.send(template)',
  'score > 80 ? assign()',
  'pipeline.stage++',
];

export function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const cols: { x: number; y: number; speed: number; text: string }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = Math.min(520, window.innerHeight * 0.55);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols.length = 0;
      const count = Math.floor(w / 140);
      for (let i = 0; i < count; i += 1) {
        cols.push({
          x: (i / count) * w + 20,
          y: Math.random() * h,
          speed: 0.25 + Math.random() * 0.45,
          text: SNIPPETS[i % SNIPPETS.length],
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px ui-monospace, monospace';

      for (const col of cols) {
        col.y += col.speed;
        if (col.y > h + 20) col.y = -20;
        ctx.fillStyle = 'rgba(0,212,255,0.07)';
        ctx.fillText(col.text, col.x, col.y);
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(520px,55vh)] opacity-80"
      aria-hidden
    />
  );
}
