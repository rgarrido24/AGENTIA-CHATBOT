'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { revealTransition } from './motion';

export function SectionBridge() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className="my-6 h-px w-full max-w-4xl opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF44, transparent)' }} />;

  return (
    <motion.div
      className="relative mx-auto my-8 h-px w-full max-w-4xl overflow-hidden"
      aria-hidden
      initial={{ opacity: 0, scaleX: 0.3 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={revealTransition(0, 0.5)}
    >
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.35) 50%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}
