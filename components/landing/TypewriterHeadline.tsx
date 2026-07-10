'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const PHRASES = [
  'WhatsApp con IA 24/7',
  'CRM para tu equipo',
  'leads de Meta automáticos',
  'automatizaciones Zapier',
];

export function TypewriterHeadline() {
  const reduceMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

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
          window.setTimeout(() => setDeleting(true), 1400);
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

    const delay = deleting ? 28 : 42;
    const id = window.setTimeout(tick, delay);
    return () => window.clearTimeout(id);
  }, [text, deleting, phraseIndex, reduceMotion]);

  return (
    <span className="text-[#00D4FF]">
      {text}
      <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[#FFD700] align-middle" aria-hidden />
    </span>
  );
}
