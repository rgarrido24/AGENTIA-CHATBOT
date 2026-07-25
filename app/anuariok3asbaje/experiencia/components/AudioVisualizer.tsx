"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { springTap } from "./SoftImage";

type Props = {
  src?: string | null;
  label?: string;
  bars?: number;
  className?: string;
};

export function AudioVisualizer({
  src,
  label = "Escuchar",
  bars = 18,
  className = "",
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(Boolean(src));
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.25 + ((i * 37) % 75) / 100),
    [bars]
  );

  useEffect(() => {
    setAvailable(Boolean(src));
    setPlaying(false);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !available) {
      // Demo visual sin archivo: pulso breve
      setPlaying(true);
      window.setTimeout(() => setPlaying(false), 2200);
      return;
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setAvailable(false);
      setPlaying(true);
      window.setTimeout(() => setPlaying(false), 2200);
    }
  };

  return (
    <div className={`audio-viz ${className}`}>
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          preload="none"
          onError={() => setAvailable(false)}
        />
      ) : null}

      <motion.button
        type="button"
        className="audio-viz__btn"
        onClick={toggle}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={springTap}
        aria-pressed={playing}
        aria-label={playing ? "Pausar audio" : label}
      >
        <AnimatePresence mode="wait" initial={false}>
          {playing ? (
            <motion.span
              key="pause"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springTap}
            >
              <Pause size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="play"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springTap}
            >
              <Play size={16} />
            </motion.span>
          )}
        </AnimatePresence>
        <span>{playing ? "Sonando…" : label}</span>
      </motion.button>

      <div className="audio-viz__wave" aria-hidden>
        {heights.map((h, i) => (
          <motion.span
            key={i}
            className="audio-viz__bar"
            animate={
              playing
                ? {
                    scaleY: [h * 0.5, 0.35 + (i % 5) * 0.14, h, 0.4 + (i % 3) * 0.18],
                  }
                : { scaleY: 0.28 }
            }
            transition={
              playing
                ? {
                    duration: 0.55 + (i % 4) * 0.08,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }
                : { type: "spring", stiffness: 280, damping: 28 }
            }
            style={{ originY: 1 }}
          />
        ))}
      </div>
    </div>
  );
}
