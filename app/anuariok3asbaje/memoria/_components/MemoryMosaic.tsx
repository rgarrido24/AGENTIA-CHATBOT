'use client';

import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

type Item = { url: string; caption?: string };

/** Galería mosaico estilo Apple Photos + lightbox shared-element */
export function MemoryMosaic({ items, title = 'Recuerdos' }: { items: Item[]; title?: string }) {
  const [active, setActive] = useState<Item | null>(null);
  if (!items.length) return null;

  const layout = items.map((item, i) => {
    const pattern = i % 7;
    if (pattern === 0) return { ...item, span: 'wide' as const };
    if (pattern === 3) return { ...item, span: 'tall' as const };
    return { ...item, span: 'norm' as const };
  });

  return (
    <LayoutGroup>
      <section style={{ background: '#050505', color: '#f5f5f7', padding: '6rem 6% 5rem' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 1.1 }}
          style={{
            fontFamily: 'var(--mem-display)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            letterSpacing: '-0.03em',
            margin: '0 0 2.5rem',
          }}
        >
          {title}
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridAutoRows: 'minmax(110px, 16vw)',
            gap: '0.55rem',
          }}
        >
          {layout.map((item, i) => (
            <motion.button
              key={`${item.url}-${i}`}
              layoutId={`mosaic-${item.url}`}
              type="button"
              onClick={() => setActive(item)}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                border: 0,
                padding: 0,
                cursor: 'zoom-in',
                overflow: 'hidden',
                background: '#111',
                gridColumn:
                  item.span === 'wide'
                    ? 'span 4'
                    : item.span === 'tall'
                      ? 'span 2'
                      : 'span 2',
                gridRow: item.span === 'tall' ? 'span 2' : 'span 1',
                borderRadius: 2,
              }}
            >
              <Image
                src={item.url}
                alt={item.caption || ''}
                fill
                sizes="(max-width:768px) 50vw, 33vw"
                loading="lazy"
                style={{ objectFit: 'cover' }}
                unoptimized={item.url.startsWith('/anuario') || item.url.includes('res.cloudinary.com')}
              />
            </motion.button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {active ? (
          <motion.div
            key="lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85 }}
            onClick={() => setActive(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(18px)',
              display: 'grid',
              placeItems: 'center',
              padding: '4vw',
              cursor: 'zoom-out',
            }}
          >
            <motion.div
              layoutId={`mosaic-${active.url}`}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                width: 'min(92vw, 960px)',
                aspectRatio: '4 / 3',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={active.url}
                alt={active.caption || ''}
                fill
                sizes="92vw"
                style={{ objectFit: 'cover' }}
                unoptimized={active.url.startsWith('/anuario') || active.url.includes('res.cloudinary.com')}
              />
            </motion.div>
            {active.caption ? (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.9 }}
                style={{
                  position: 'absolute',
                  bottom: '6%',
                  color: 'rgba(245,245,247,0.7)',
                  fontWeight: 300,
                  fontSize: '0.95rem',
                }}
              >
                {active.caption}
              </motion.p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
