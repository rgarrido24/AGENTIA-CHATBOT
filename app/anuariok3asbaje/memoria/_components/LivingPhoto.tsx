'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { useSoftParallax } from '../_lib/useSoftParallax';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  intensity?: number;
};

/** Foto protagonista: Ken Burns + parallax mouse/giroscopio + glow */
export function LivingPhoto({ src, alt = '', className, style, priority, intensity = 10 }: Props) {
  const parallax = useSoftParallax(intensity);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 40, damping: 20, mass: 0.8 });

  useEffect(() => {
    mx.set(parallax.x);
    my.set(parallax.y);
  }, [parallax.x, parallax.y, mx, my]);

  if (!src) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'radial-gradient(circle at 40% 30%, #2a2a2e, #0a0a0b)',
        }}
      />
    );
  }

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        overflow: 'hidden',
        isolation: 'isolate',
        x: sx,
        y: sy,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-8%',
          background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.12), transparent 55%)`,
          pointerEvents: 'none',
          zIndex: 2,
          mixBlendMode: 'soft-light',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: '-12%',
          willChange: 'transform',
        }}
        animate={{ scale: [1.05, 1.14, 1.05], x: ['0%', '-1.5%', '0%'], y: ['0%', '1%', '0%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          style={{
            objectFit: 'cover',
            filter: 'contrast(1.04) saturate(0.92)',
          }}
          unoptimized={src.startsWith('/anuario') || src.includes('res.cloudinary.com')}
        />
      </motion.div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.35)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

export function KenBurnsChapter({
  src,
  title,
  subtitle,
}: {
  src: string;
  title: string;
  subtitle?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.22]);
  const y = useTransform(scrollYProgress, [0, 1], ['4%', '-6%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.4]);

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        height: '140vh',
        background: '#000',
      }}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', inset: 0, scale, y, opacity }}>
          <LivingPhoto src={src} intensity={6} style={{ position: 'absolute', inset: 0 }} />
        </motion.div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            bottom: '14%',
            color: '#f5f5f7',
            maxWidth: 720,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--mem-sans)',
              fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              opacity: 0.55,
              marginBottom: '1rem',
            }}
          >
            Capítulo
          </p>
          <h2
            style={{
              fontFamily: 'var(--mem-display)',
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 7vw, 4.8rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              style={{
                marginTop: '1.25rem',
                fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
                opacity: 0.72,
                fontWeight: 300,
                maxWidth: 420,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
