'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function WifiSignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      t += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const sources = [
        { x: w * 0.15, y: h * 0.25, color: 'rgba(0,177,64,0.5)' },
        { x: w * 0.85, y: h * 0.2, color: 'rgba(34,211,238,0.4)' },
        { x: w * 0.5, y: h * 0.75, color: 'rgba(244,114,182,0.35)' },
      ];

      for (const src of sources) {
        for (let ring = 0; ring < 4; ring++) {
          const phase = (t * 1.2 + ring * 0.7) % 4;
          const radius = 20 + phase * 55;
          const alpha = Math.max(0, 0.45 - phase * 0.11);
          ctx.beginPath();
          ctx.arc(src.x, src.y, radius, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.strokeStyle = src.color.replace(/[\d.]+\)$/, `${alpha.toFixed(2)})`);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
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
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
