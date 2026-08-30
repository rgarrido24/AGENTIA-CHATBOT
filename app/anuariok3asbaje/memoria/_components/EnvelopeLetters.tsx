'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function Typewriter({ text, active, cps = 28 }: { text: string; active: boolean; cps?: number }) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) {
      setOut('');
      return;
    }
    setOut('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, Math.max(18, 1000 / cps));
    return () => window.clearInterval(id);
  }, [text, active, cps]);
  return (
    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontWeight: 300, lineHeight: 1.7, fontSize: '1.05rem' }}>
      {out}
      <span style={{ opacity: 0.35 }}>{active && out.length < text.length ? '|' : ''}</span>
    </p>
  );
}

/** Sobre → carta → máquina de escribir lenta */
export function EnvelopeLetters({ messages }: { messages: { autor: string; texto: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!messages.length) return null;

  return (
    <section
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#f5f5f7',
        display: 'grid',
        placeItems: 'center',
        padding: '5rem 6%',
      }}
    >
      <div style={{ width: 'min(720px, 100%)' }}>
        <motion.h2
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 1.1 }}
          style={{
            fontFamily: 'var(--mem-display)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            letterSpacing: '-0.03em',
            margin: '0 0 2.5rem',
            textAlign: 'center',
          }}
        >
          Mensajes
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, i) => {
            const open = openIdx === i;
            return (
              <div key={`${msg.autor}-${i}`} style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {!open ? (
                    <motion.button
                      key="env"
                      type="button"
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                      transition={{ duration: 0.95 }}
                      onClick={() => setOpenIdx(i)}
                      style={{
                        width: '100%',
                        border: 0,
                        cursor: 'pointer',
                        padding: '2.4rem 1.8rem',
                        borderRadius: 18,
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                        color: '#f5f5f7',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          opacity: 0.5,
                          marginBottom: '0.65rem',
                        }}
                      >
                        Toca para abrir
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 300 }}>Carta de {msg.autor}</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="letter"
                      initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        padding: '2.4rem 1.9rem',
                        borderRadius: 4,
                        background: 'linear-gradient(180deg, #f7f4ee, #ebe6dc)',
                        color: '#1d1d1f',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                        minHeight: 220,
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 1.25rem',
                          fontSize: '0.72rem',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          opacity: 0.55,
                        }}
                      >
                        {msg.autor}
                      </p>
                      <Typewriter text={msg.texto} active={open} cps={22} />
                      <button
                        type="button"
                        onClick={() => setOpenIdx(null)}
                        style={{
                          marginTop: '1.75rem',
                          border: 0,
                          background: 'transparent',
                          color: 'rgba(0,0,0,0.45)',
                          fontSize: '0.8rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Cerrar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
