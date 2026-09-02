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

const STEP_MS = 90;

/** Reveals Antes / Después one step at a time when the block enters view. Once only. */
export function SequenceReveal() {
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  // Sin JS los pasos deben quedar visibles: solo se ocultan tras hidratar.
  const [armed, setArmed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setStarted(true);
      return;
    }
    setArmed(true);
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [reduced]);

  const hidden = armed && !started;
  const delay = (i: number) =>
    reduced ? undefined : { animationDelay: `${i * STEP_MS}ms` };

  return (
    <div ref={rootRef} className="relative mt-10">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-white p-7 ring-1 ring-[#14161A]/8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">
            Antes
          </p>
          <ul className="mt-6 space-y-4">
            {BEFORE.map((t, i) => (
              <li
                key={t}
                className={`flex items-center gap-3 text-[#14161A]/55 ${
                  hidden ? 'opacity-0' : ''
                } ${started ? 'lealtad-seq-item' : ''}`}
                style={started ? delay(i) : undefined}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F1EC] text-xs font-medium text-[#14161A]/40">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.5rem] bg-white p-7 ring-1 ring-[#B8935A]/30">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#B8935A' }}
          >
            Después
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {AFTER.map((t, i) => (
              <span
                key={t}
                className={`inline-flex items-center gap-2 rounded-full bg-[#F3F1EC] px-3 py-1.5 text-sm text-[#14161A] ${
                  hidden ? 'opacity-0' : ''
                } ${started ? 'lealtad-seq-item' : ''}`}
                style={started ? delay(i) : undefined}
              >
                <span className="text-[10px] font-semibold" style={{ color: '#B8935A' }}>
                  {i + 1}
                </span>
                {t}
                {i < AFTER.length - 1 ? (
                  <ArrowRight className="hidden h-3 w-3 text-[#14161A]/25 sm:inline" />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
