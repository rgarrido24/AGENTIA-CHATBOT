'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useHeavyLenis } from '../_lib/useHeavyLenis';
import { useAmbientAudio } from '../_lib/useAmbientAudio';
import { KenBurnsChapter, LivingPhoto } from './LivingPhoto';
import { StudentDocumentary, type MemoriaStudent } from './StudentDocumentary';
import { MemoryMosaic } from './MemoryMosaic';
import { EnvelopeLetters } from './EnvelopeLetters';
import { SoftSparkles } from './SoftSparkles';

export type MemoriaPayload = {
  mode: 'salon' | 'alumno';
  generacion: string;
  salon: string;
  coverUrl: string;
  chapterUrl: string;
  students: MemoriaStudent[];
};

const ease = [0.22, 1, 0.36, 1] as const;

function AmbientMesh() {
  return (
    <div aria-hidden className="mem-mesh">
      <div className="mem-mesh__blob mem-mesh__blob--a" />
      <div className="mem-mesh__blob mem-mesh__blob--b" />
      <div className="mem-mesh__blob mem-mesh__blob--c" />
      <div className="mem-mesh__noise" />
    </div>
  );
}

function Dust() {
  return (
    <div aria-hidden className="mem-dust">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} style={{ ['--i' as string]: i }} />
      ))}
    </div>
  );
}

export function MemoriaExperience({ data }: { data: MemoriaPayload }) {
  const [phase, setPhase] = useState<'intro' | 'experience' | 'finale'>('intro');
  const [introStep, setIntroStep] = useState(0);
  const [scrollReady, setScrollReady] = useState(false);
  const audio = useAmbientAudio();
  useHeavyLenis(phase === 'experience');

  const begin = useCallback(() => {
    setPhase('experience');
    audio.setTone('chapter');
  }, [audio]);

  const restart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setIntroStep(0);
    setScrollReady(false);
    setPhase('intro');
  }, []);

  useEffect(() => {
    if (phase !== 'intro' || !scrollReady) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 8) begin();
    };
    const onTouch = () => begin();
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchend', onTouch, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchend', onTouch);
    };
  }, [phase, scrollReady, begin]);

  useEffect(() => {
    if (phase !== 'intro') return;
    const timers = [
      window.setTimeout(() => setIntroStep(1), 900),
      window.setTimeout(() => setIntroStep(2), 4200),
      window.setTimeout(() => setIntroStep(3), 6200),
      window.setTimeout(() => setScrollReady(true), 7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase === 'experience') audio.setTone('chapter');
    if (phase === 'finale') audio.silenceFinale();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const primary = data.students[0];
  const galleryItems =
    data.mode === 'alumno' && primary
      ? primary.gallery
      : data.students.flatMap((s) => s.gallery.map((g) => ({ ...g, caption: g.caption || s.nombre })));

  const messages =
    data.mode === 'alumno' && primary
      ? primary.mensajes
      : data.students.flatMap((s) => s.mensajes.map((m) => ({ ...m, autor: `${m.autor} · ${s.nombre}` })));

  return (
    <div className="mem-root">
      <AmbientMesh />
      <Dust />
      <SoftSparkles />

      <button
        type="button"
        className="mem-sound"
        onClick={() => void audio.toggle()}
        aria-pressed={audio.enabled}
      >
        {audio.enabled ? 'Sonido activado' : 'Activar sonido'}
      </button>

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.section
            key="intro"
            className="mem-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(16px)', scale: 1.02 }}
            transition={{ duration: 1.25, ease }}
          >
            <AnimatePresence mode="wait">
              {introStep === 1 ? (
                <motion.p
                  key="quote"
                  className="mem-intro__quote"
                  initial={{ opacity: 0, y: 18, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 1.35, ease }}
                >
                  Algunas aventuras duran un año…
                  <br />
                  otras duran toda la vida.
                </motion.p>
              ) : null}
              {introStep === 2 ? (
                <motion.p
                  key="gen"
                  className="mem-intro__gen"
                  initial={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(8px)' }}
                  transition={{ duration: 1.2, ease }}
                >
                  Generación {data.generacion}
                </motion.p>
              ) : null}
              {introStep >= 3 ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.1 }}
                  style={{ textAlign: 'center' }}
                >
                  <p className="mem-intro__meta">{data.salon}</p>
                  {scrollReady ? (
                    <motion.button
                      type="button"
                      className="mem-intro__cta"
                      onClick={begin}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                    >
                      Scroll para comenzar
                    </motion.button>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.section>
        ) : null}

        {phase === 'experience' ? (
          <motion.main
            key="exp"
            initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.015 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.35, ease }}
          >
            <KenBurnsChapter
              src={data.chapterUrl || data.coverUrl}
              title="La aventura comienza"
              subtitle="Un año de primeras veces, risas y descubrimientos."
            />

            {(data.mode === 'alumno' ? data.students.slice(0, 1) : data.students).map((s) => (
              <div key={s.slug} onFocus={() => audio.setTone('student')}>
                <StudentDocumentary student={s} />
                {s.gallery.length ? (
                  <div onFocus={() => audio.setTone('gallery')}>
                    <MemoryMosaic items={s.gallery} title={`Recuerdos de ${s.nombre}`} />
                  </div>
                ) : null}
                {s.mensajes.length ? (
                  <div onFocus={() => audio.setTone('letter')}>
                    <EnvelopeLetters messages={s.mensajes} />
                  </div>
                ) : null}
              </div>
            ))}

            {data.mode === 'salon' && galleryItems.length > 0 && data.students.every((s) => !s.gallery.length) ? (
              <MemoryMosaic items={galleryItems} title="Memoria del salón" />
            ) : null}

            {data.mode === 'salon' && messages.length > 0 && data.students.every((s) => !s.mensajes.length) ? (
              <EnvelopeLetters messages={messages} />
            ) : null}

            <section className="mem-bridge">
              <LivingPhoto
                src={data.coverUrl}
                intensity={4}
                style={{ position: 'absolute', inset: 0, opacity: 0.35 }}
              />
              <motion.button
                type="button"
                className="mem-bridge__cta"
                onClick={() => setPhase('finale')}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
              >
                Continuar al final
              </motion.button>
            </section>
          </motion.main>
        ) : null}

        {phase === 'finale' ? (
          <motion.section
            key="finale"
            className="mem-finale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <motion.p
              initial={{ opacity: 0, filter: 'blur(12px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 1.1, duration: 1.4 }}
              className="mem-finale__thanks"
            >
              Gracias por acompañarnos en esta aventura.
            </motion.p>
            <motion.button
              type="button"
              className="mem-finale__heart"
              onClick={restart}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.6, duration: 1.3 }}
            >
              <span aria-hidden className="mem-finale__heart-glyph">
                ♥
              </span>
              <span>Volver a vivir este recuerdo</span>
            </motion.button>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
