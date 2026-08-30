'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** Micro-destellos discretos con GSAP (GPU) */
export function SoftSparkles() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const dots = Array.from(el.querySelectorAll<HTMLElement>('.mem-spark'));
    const ctx = gsap.context(() => {
      dots.forEach((dot, i) => {
        gsap.to(dot, {
          opacity: gsap.utils.random(0.05, 0.35),
          scale: gsap.utils.random(0.6, 1.4),
          duration: gsap.utils.random(2.8, 5.5),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.18,
        });
        gsap.to(dot, {
          y: gsap.utils.random(-18, 18),
          x: gsap.utils.random(-12, 12),
          duration: gsap.utils.random(8, 14),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.1,
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="mem-sparkles">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="mem-spark" style={{ left: `${8 + i * 7}%`, top: `${12 + (i % 5) * 16}%` }} />
      ))}
      <style jsx>{`
        .mem-sparkles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .mem-spark {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          opacity: 0.12;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
