"use client";

import { useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SoftImage, springCard } from "./SoftImage";
import { ASSETS } from "../data";

const TITLE = "Mis Días de Aventura";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 22 });
  const sy = useSpring(my, { stiffness: 120, damping: 22 });
  const balloons = useMemo(
    () => [
      { emoji: "🤠", x: "12%", y: "22%", depth: 18 },
      { emoji: "🚀", x: "78%", y: "18%", depth: 28 },
      { emoji: "⭐", x: "68%", y: "58%", depth: 14 },
      { emoji: "🎈", x: "22%", y: "62%", depth: 22 },
      { emoji: "🛸", x: "86%", y: "42%", depth: 16 },
    ],
    []
  );

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    mx.set(px);
    my.set(py);
  };

  return (
    <section
      ref={ref}
      className="hero"
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div className="hero__grain" aria-hidden />
      <div className="hero__mesh" aria-hidden />

      {balloons.map((b, i) => (
        <Balloon key={i} emoji={b.emoji} x={b.x} y={b.y} depth={b.depth} sx={sx} sy={sy} />
      ))}

      <div className="hero__content">
        <motion.div
          className="hero__stamp"
          initial={{ opacity: 0, rotate: -8, y: 24 }}
          animate={{ opacity: 1, rotate: -3, y: 0 }}
          transition={springCard}
        >
          <SoftImage
            src={ASSETS.heroPortada}
            alt="Sello postal Toy Story"
            className="hero__stamp-img"
            fallbackLabel="Sello postal"
            accent="#7B5294"
          />
          <span className="hero__stamp-label">POSTAL · K3</span>
        </motion.div>

        <p className="hero__eyebrow">Colegio Asbaje · Generación 2024-2026</p>
        <WordReveal text={TITLE} />
        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springCard, delay: 0.35 }}
        >
          Bitácora espacial de vaqueritos — una misión llena de amigos, risas y estrellas.
        </motion.p>
      </div>
    </section>
  );
}

function Balloon({
  emoji,
  x,
  y,
  depth,
  sx,
  sy,
}: {
  emoji: string;
  x: string;
  y: string;
  depth: number;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
}) {
  const tx = useTransform(sx, (v) => v * depth);
  const ty = useTransform(sy, (v) => v * depth);
  return (
    <motion.span
      className="hero__balloon"
      style={{ left: x, top: y, x: tx, y: ty }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4.2 + depth * 0.05, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      {emoji}
    </motion.span>
  );
}

function WordReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="hero__title" aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="hero__word"
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...springCard, delay: 0.12 + i * 0.08 }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}
