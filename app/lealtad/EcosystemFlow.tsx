'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const NODES = [
  'Chatbot IA',
  'WhatsApp',
  'Lealtad',
  'Automatización',
  'Google Reviews',
  'Más clientes',
] as const;

/**
 * Flujo de ecosistema con líneas SVG que se dibujan al entrar en viewport.
 */
export function EcosystemFlow() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(!!reduceMotion);
  const [visibleCount, setVisibleCount] = useState(reduceMotion ? NODES.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDrawn(true);
      setVisibleCount(NODES.length);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setDrawn(true);
        NODES.forEach((_, i) => {
          timers.push(
            window.setTimeout(() => {
              setVisibleCount((n) => Math.max(n, i + 1));
            }, i * 220),
          );
        });
        io.disconnect();
      },
      { threshold: 0.3 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [reduceMotion]);

  const pathLen = 120;

  return (
    <div ref={rootRef} className="mt-10">
      {/* Desktop / tablet: fila con SVG connectors */}
      <div className="mx-auto hidden max-w-5xl md:block">
        <div className="flex items-center justify-between gap-1 px-2">
          {NODES.map((node, i) => (
            <div key={node} className="flex flex-1 items-center">
              <div
                className={`w-full rounded-2xl border px-2 py-3 text-center text-[11px] font-semibold leading-snug transition-opacity duration-300 lg:text-xs ${
                  i === NODES.length - 1
                    ? 'border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#00D4FF]'
                    : 'border-white/12 bg-white/[0.04] text-white/75'
                }`}
                style={{
                  opacity: visibleCount > i ? 1 : 0.25,
                  transitionProperty: reduceMotion ? 'none' : 'opacity',
                }}
              >
                {node}
              </div>
              {i < NODES.length - 1 ? (
                <svg
                  className="mx-0.5 h-3 w-8 shrink-0 lg:w-10"
                  viewBox={`0 0 ${pathLen} 12`}
                  aria-hidden
                >
                  <path
                    d={`M 2 6 H ${pathLen - 8}`}
                    fill="none"
                    stroke="rgba(0,212,255,0.55)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={pathLen}
                    strokeDashoffset={drawn ? 0 : pathLen}
                    style={{
                      transition: reduceMotion
                        ? 'none'
                        : `stroke-dashoffset 0.55s ease-out ${i * 0.18}s`,
                    }}
                  />
                  <path
                    d={`M ${pathLen - 14} 2 L ${pathLen - 4} 6 L ${pathLen - 14} 10`}
                    fill="none"
                    stroke="rgba(0,212,255,0.55)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={24}
                    strokeDashoffset={drawn ? 0 : 24}
                    style={{
                      transition: reduceMotion
                        ? 'none'
                        : `stroke-dashoffset 0.35s ease-out ${i * 0.18 + 0.35}s`,
                    }}
                  />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: columna con conectores verticales */}
      <div className="mx-auto flex max-w-xs flex-col items-center md:hidden">
        {NODES.map((node, i) => (
          <div key={node} className="flex w-full flex-col items-center">
            <div
              className={`w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-opacity duration-300 ${
                i === NODES.length - 1
                  ? 'border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#00D4FF]'
                  : 'border-white/12 bg-white/[0.04] text-white/75'
              }`}
              style={{
                opacity: visibleCount > i ? 1 : 0.25,
                transitionProperty: reduceMotion ? 'none' : 'opacity',
              }}
            >
              {node}
            </div>
            {i < NODES.length - 1 ? (
              <svg className="my-1 h-8 w-4" viewBox="0 0 16 32" aria-hidden>
                <path
                  d="M 8 2 V 24"
                  fill="none"
                  stroke="rgba(0,212,255,0.55)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={28}
                  strokeDashoffset={drawn ? 0 : 28}
                  style={{
                    transition: reduceMotion
                      ? 'none'
                      : `stroke-dashoffset 0.45s ease-out ${i * 0.15}s`,
                  }}
                />
                <path
                  d="M 4 20 L 8 26 L 12 20"
                  fill="none"
                  stroke="rgba(0,212,255,0.55)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={20}
                  strokeDashoffset={drawn ? 0 : 20}
                  style={{
                    transition: reduceMotion
                      ? 'none'
                      : `stroke-dashoffset 0.3s ease-out ${i * 0.15 + 0.25}s`,
                  }}
                />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
