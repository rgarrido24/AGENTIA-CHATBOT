'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LivingPhoto } from './LivingPhoto';

export type MemoriaStudent = {
  slug: string;
  nombre: string;
  nombreCompleto?: string;
  portadaUrl: string;
  perfilUrl: string;
  gallery: { url: string; caption?: string }[];
  facts: {
    color: string;
    sueno: string;
    comida: string;
    amigos: string;
    frase: string;
    gusto: string;
  };
  mensajes: { autor: string; texto: string }[];
};

const FACT_ORDER: { key: keyof MemoriaStudent['facts']; label: string }[] = [
  { key: 'color', label: 'Color favorito' },
  { key: 'sueno', label: 'Sueño' },
  { key: 'comida', label: 'Comida' },
  { key: 'amigos', label: 'Mejores amigos' },
  { key: 'frase', label: 'Frase favorita' },
  { key: 'gusto', label: 'Lo que más le gustó del kinder' },
];

/** Un alumno = un pequeño documental (revelación secuencial) */
export function StudentDocumentary({ student }: { student: MemoriaStudent }) {
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const facts = FACT_ORDER.filter((f) => student.facts[f.key]?.trim());
    if (revealed >= facts.length) return;
    const t = window.setTimeout(() => setRevealed((n) => n + 1), 1400);
    return () => window.clearTimeout(t);
  }, [started, revealed, student.facts]);

  const facts = FACT_ORDER.filter((f) => student.facts[f.key]?.trim());
  const hero = student.perfilUrl || student.portadaUrl || student.gallery[0]?.url || '';

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#050505',
        color: '#f5f5f7',
        display: 'grid',
        gridTemplateRows: '1fr auto',
      }}
    >
      <div style={{ position: 'relative', minHeight: '78vh' }}>
        <LivingPhoto
          src={hero}
          alt={student.nombre}
          intensity={14}
          priority
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.88) 100%)',
          }}
        />
        <motion.h2
          initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
          onViewportEnter={() => setStarted(true)}
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            bottom: '18%',
            margin: 0,
            fontFamily: 'var(--mem-display)',
            fontWeight: 400,
            fontSize: 'clamp(3rem, 10vw, 6.5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
          }}
        >
          {student.nombre}
        </motion.h2>
      </div>

      <div
        style={{
          padding: '2.5rem 8% 4.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          maxWidth: 640,
        }}
      >
        <AnimatePresence mode="sync">
          {facts.slice(0, revealed).map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.45,
                }}
              >
                {f.label}
              </p>
              <p
                style={{
                  margin: '0.45rem 0 0',
                  fontSize: 'clamp(1.15rem, 2.6vw, 1.55rem)',
                  fontWeight: 300,
                  lineHeight: 1.45,
                  letterSpacing: '-0.01em',
                }}
              >
                {student.facts[f.key]}
              </p>
              {i < revealed - 1 ? null : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
