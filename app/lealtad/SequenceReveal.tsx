'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const BEFORE = ['Compra', 'Se va', 'No vuelve', 'Pagas otra vez por atraer'];

const AFTER = [
  'Compra',
  'Guarda su pase',
  'Acumula',
  'Recibe promo',
  'Regresa',
  'Compra otra vez',
  'Trae amigos',
];

/** Reveals Antes / Después one step at a time on scroll. Once only. Respects reduced motion. */
export function SequenceReveal() {
  const reduced = useReducedMotion();
  const total = AFTER.length;
  const [step, setStep] = useState(reduced ? total : 0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setStep(total);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-seq]')];
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting);
        if (!hit.length) return;
        const max = Math.max(
          ...hit.map((e) => Number(e.target.getAttribute('data-seq') || '0')),
        );
        setStep((s) => Math.max(s, max + 1));
      },
      { threshold: 0.35, rootMargin: '-28% 0px -45% 0px' },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [reduced, total]);

  const shownBefore = reduced ? BEFORE : BEFORE.slice(0, Math.min(step, BEFORE.length));
  const shownAfter = reduced ? AFTER : AFTER.slice(0, Math.min(step, AFTER.length));

  return (
    <div
      ref={rootRef}
      className="relative mt-10"
      style={reduced ? undefined : { minHeight: '150vh' }}
    >
      <div className="lg:sticky lg:top-24">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">
              Antes
            </p>
            <ul className="mt-6 space-y-4">
              {shownBefore.map((t, i) => (
                <li
                  key={t}
                  className="lealtad-seq-item flex items-center gap-3 text-[#14161A]/55"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F1EC] text-xs font-medium text-[#14161A]/40">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="h-full rounded-[1.5rem] bg-white p-7 ring-1 ring-[#B8935A]/30">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#B8935A' }}
            >
              Después
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {shownAfter.map((t, i) => (
                <span
                  key={t}
                  className="lealtad-seq-item inline-flex items-center gap-2 rounded-full bg-[#F3F1EC] px-3 py-1.5 text-sm text-[#14161A]"
                >
                  <span className="text-[10px] font-semibold" style={{ color: '#B8935A' }}>
                    {i + 1}
                  </span>
                  {t}
                  {i < shownAfter.length - 1 ? (
                    <ArrowRight className="hidden h-3 w-3 text-[#14161A]/25 sm:inline" />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 flex flex-col" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} data-seq={i} className="flex-1" />
          ))}
        </div>
      )}
    </div>
  );
}
