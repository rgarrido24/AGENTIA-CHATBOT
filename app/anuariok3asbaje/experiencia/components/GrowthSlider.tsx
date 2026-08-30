"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoftImage, springCard } from "./SoftImage";

type Props = {
  primerDiaSrc: string | null;
  diaFinalSrc: string | null;
  alt: string;
  accent?: string;
};

/**
 * Estilo Live Photo: hover / press largo muestra Día Final.
 * Cuando no hay fotos, muestra placeholders etiquetados.
 */
export function GrowthSlider({ primerDiaSrc, diaFinalSrc, alt, accent }: Props) {
  const [showFinal, setShowFinal] = useState(false);
  const pressTimer = useRef<number | null>(null);

  const startPress = () => {
    pressTimer.current = window.setTimeout(() => setShowFinal(true), 280);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    setShowFinal(false);
  };

  return (
    <motion.div
      className="growth-slider"
      onMouseEnter={() => setShowFinal(true)}
      onMouseLeave={() => setShowFinal(false)}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      whileHover={{ y: -4 }}
      transition={springCard}
    >
      <div className="growth-slider__frame">
        <SoftImage
          src={primerDiaSrc}
          alt={`${alt} — Primer día`}
          className="growth-slider__img"
          fallbackLabel="Primer día"
          accent={accent}
        />
        <AnimatePresence>
          {showFinal ? (
            <motion.div
              className="growth-slider__overlay"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={springCard}
            >
              <SoftImage
                src={diaFinalSrc}
                alt={`${alt} — Día final`}
                className="growth-slider__img"
                fallbackLabel="Día final"
                accent={accent}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="growth-slider__chip" aria-live="polite">
        {showFinal ? "Día final ✨" : "Mantén / pasa el cursor · Primer día"}
      </div>
    </motion.div>
  );
}
