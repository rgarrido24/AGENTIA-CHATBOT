'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function CircuitField() {
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

    const nodes: { x: number; y: number }[] = [
      { x: 0.12, y: 0.22 },
      { x: 0.28, y: 0.38 },
      { x: 0.45, y: 0.18 },
      { x: 0.62, y: 0.42 },
      { x: 0.78, y: 0.25 },
      { x: 0.88, y: 0.55 },
      { x: 0.35, y: 0.68 },
      { x: 0.58, y: 0.78 },
    ];

    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [1, 6],
      [6, 7],
      [3, 7],
      [6, 3],
    ];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      t += 0.012;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const [a, b] of edges) {
        const n1 = nodes[a];
        const n2 = nodes[b];
        const x1 = n1.x * w;
        const y1 = n1.y * h;
        const x2 = n2.x * w;
        const y2 = n2.y * h;
        const pulse = 0.25 + 0.2 * Math.sin(t * 2 + a);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(0,212,255,${pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const dot = (t * 0.35 + a * 0.17) % 1;
        const px = x1 + (x2 - x1) * dot;
        const py = y1 + (y2 - y1) * dot;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.85)';
        ctx.fill();
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.55)';
        ctx.fill();
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
      className="pointer-events-none fixed inset-0 z-[1] opacity-35"
      aria-hidden
    />
  );
}
