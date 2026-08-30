"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { springCard, springTap } from "./SoftImage";
import type { Lamina } from "../pdfManifest";

/** Card interactiva de una lámina del PDF Canva */
export function LaminaCard({
  lamina,
  onOpen,
}: {
  lamina: Lamina;
  onOpen: (lamina: Lamina) => void;
}) {
  return (
    <motion.button
      type="button"
      className="lamina-card"
      onClick={() => onOpen(lamina)}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={springTap}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="lamina-card__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lamina.src} alt={lamina.title} loading="lazy" />
        <span className="lamina-card__zoom" aria-hidden>
          <Maximize2 size={14} strokeWidth={1.75} />
        </span>
      </div>
      <div className="lamina-card__meta">
        <strong>{lamina.title}</strong>
        <span>Pág. {lamina.page}</span>
      </div>
    </motion.button>
  );
}

export function LaminaLightbox({
  lamina,
  onClose,
  onPrev,
  onNext,
}: {
  lamina: Lamina | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  if (!lamina) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="lamina-lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={lamina.title}
      >
        <button type="button" className="lamina-lightbox__bg" aria-label="Cerrar" onClick={onClose} />
        <motion.div
          className="lamina-lightbox__panel"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={springCard}
        >
          <div className="lamina-lightbox__bar">
            <div>
              <p className="eyebrow">{lamina.kind}</p>
              <h3>{lamina.title}</h3>
            </div>
            <motion.button
              type="button"
              className="vaul-close"
              onClick={onClose}
              whileTap={{ scale: 0.96 }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </motion.button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lamina.src} alt={lamina.title} className="lamina-lightbox__img" />
          <div className="lamina-lightbox__nav">
            <button type="button" onClick={onPrev} disabled={!onPrev}>
              Anterior
            </button>
            <span>Pág. {lamina.page} / 55</span>
            <button type="button" onClick={onNext} disabled={!onNext}>
              Siguiente
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function LaminaStrip({
  laminas,
  heading,
  sub,
}: {
  laminas: Lamina[];
  heading: string;
  sub?: string;
}) {
  const [open, setOpen] = useState<Lamina | null>(null);
  if (!laminas.length) return null;

  const idx = open ? laminas.findIndex((l) => l.page === open.page) : -1;

  return (
    <div className="lamina-strip">
      <div className="lamina-strip__head">
        <h3>{heading}</h3>
        {sub ? <p>{sub}</p> : null}
      </div>
      <div className="lamina-strip__grid">
        {laminas.map((l) => (
          <LaminaCard key={l.page} lamina={l} onOpen={setOpen} />
        ))}
      </div>
      <LaminaLightbox
        lamina={open}
        onClose={() => setOpen(null)}
        onPrev={idx > 0 ? () => setOpen(laminas[idx - 1]) : undefined}
        onNext={idx >= 0 && idx < laminas.length - 1 ? () => setOpen(laminas[idx + 1]) : undefined}
      />
    </div>
  );
}
