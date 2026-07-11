'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const PHRASES = [
  'procesos manuales',
  'leads sin respuesta',
  'WhatsApp sin atender',
  'ventas perdidas',
];

export function TypewriterHeadline() {
  const reduceMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setCursorOn((v) => !v), 520);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setText(PHRASES[0]);
      return;
    }

    const full = PHRASES[phraseIndex];
    const tick = () => {
      if (!deleting) {
        const next = full.slice(0, text.length + 1);
        setText(next);
        if (next === full) {
          window.setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        const next = full.slice(0, Math.max(0, text.length - 1));
        setText(next);
        if (next.length === 0) {
          setDeleting(false);
          setPhraseIndex((i) => (i + 1) % PHRASES.length);
        }
      }
    };

    const delay = deleting ? 34 : 52;
    const id = window.setTimeout(tick, delay);
    return () => window.clearTimeout(id);
  }, [text, deleting, phraseIndex, reduceMotion]);

  return (
    <span className="relative inline-block min-h-[1.15em] text-[#00D4FF]">
      {text}
      <span
        className={`ml-0.5 inline-block h-[0.95em] w-[3px] translate-y-[0.06em] bg-[#FFD700] align-middle transition-opacity duration-100 ${
          cursorOn ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
    </span>
  );
}
