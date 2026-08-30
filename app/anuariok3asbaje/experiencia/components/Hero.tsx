"use client";

import { useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SoftImage, springCard } from "./SoftImage";
import { usePhotoStudio } from "./PhotoStudioContext";

const TITLE_WORDS = ["Mis", "Días", "de", "Aventura"];

type SpringMotion = ReturnType<typeof useSpring>;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { resolve } = usePhotoStudio();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 140, damping: 22 });
  const sy = useSpring(my, { stiffness: 140, damping: 22 });
  const plateX = useTransform(sx, (v: number) => v * -12);
  const plateY = useTransform(sy, (v: number) => v * -10);

  const layers = useMemo(
    () => [
      { id: "cow", depth: 10, className: "hero-layer hero-layer--cow" },
      { id: "bandana", depth: 16, className: "hero-layer hero-layer--bandana" },
      { id: "plaid", depth: 8, className: "hero-layer hero-layer--plaid" },
      { id: "sky", depth: 4, className: "hero-layer hero-layer--sky" },
    ],
    []
  );

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const portada = resolve("hero.portada", "/anuario-k3/paginas/pagina-01.jpg");

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
      <div className="hero__stage">
        {layers.map((layer) => (
          <ParallaxLayer
            key={layer.id}
            className={layer.className}
            depth={layer.depth}
            sx={sx}
            sy={sy}
          />
        ))}

        <motion.div className="hero__plate" style={{ x: plateX, y: plateY }}>
          <div className="bezel">
            <div className="bezel__inner hero__collage">
              <SoftImage
                src={portada}
                alt="Mis Días de Aventura — portada"
                className="hero__collage-img"
                fallbackLabel="Portada"
                accent="#1E90D6"
              />
              <div className="hero__nameplate">
                <span>Colegio Asbaje</span>
                <strong>Amaia Garrido Cárdenas</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hero__copy">
        <p className="eyebrow">Generación 2024-2026 · Kinder 3</p>
        <h1 className="hero__title" aria-label="Mis Días de Aventura">
          {TITLE_WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", duration: 0.55, bounce: 0.18, delay: 0.08 + i * 0.06 }}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springCard, delay: 0.32 }}
        >
          Bitácora digital de una misión cumplida — vaqueritos, estrellas y amigos para siempre.
        </motion.p>
      </div>
    </section>
  );
}

function ParallaxLayer({
  className,
  depth,
  sx,
  sy,
}: {
  className: string;
  depth: number;
  sx: SpringMotion;
  sy: SpringMotion;
}) {
  const x = useTransform(sx, (v: number) => v * depth);
  const y = useTransform(sy, (v: number) => v * depth);
  return <motion.div className={className} style={{ x, y }} aria-hidden />;
}
