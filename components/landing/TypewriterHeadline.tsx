'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const PHRASES = [
  'procesos manuales',
  'leads sin respuesta',
  'WhatsApp sin atender',
  'ventas perdidas',
];

const EASE = [0.23, 1, 0.32, 1] as const;

export function TypewriterHeadline() {
  const reduceMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setText(PHRASES[0]!);
      return;
    }

    const full = PHRASES[phraseIndex]!;
    const delay = deleting ? 28 : 46;

    const id = window.setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, text.length + 1);
        setText(next);
        if (next === full) window.setTimeout(() => setDeleting(true), 1600);
      } else {
        const next = full.slice(0, Math.max(0, text.length - 1));
        setText(next);
        if (next.length === 0) {
          setDeleting(false);
          setPhraseIndex((i) => (i + 1) % PHRASES.length);
        }
      }
    }, delay);

    return () => window.clearTimeout(id);
  }, [text, deleting, phraseIndex, reduceMotion]);

  return (
    <span className="relative inline-block min-h-[1.15em]">
      <motion.span
        key={phraseIndex}
        className="text-[#00D4FF]"
        initial={reduceMotion ? false : { opacity: 0.85, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        {text}
      </motion.span>
      {!reduceMotion && (
        <motion.span
          className="ml-0.5 inline-block h-[0.95em] w-[3px] translate-y-[0.06em] bg-[#FFD700] align-middle"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        />
      )}
    </span>
  );
}
