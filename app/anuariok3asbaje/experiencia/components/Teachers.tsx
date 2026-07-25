"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SoftImage, springCard } from "./SoftImage";
import { TEACHERS } from "../data";

export function Teachers() {
  return (
    <section className="section teachers" id="maestras">
      <div className="section__head">
        <p className="section__eyebrow">Pizza Planet · HQ</p>
        <h2 className="section__title">Nuestras Guardianas</h2>
        <p className="section__sub">Miss Vale & Miss Paty — quienes guiaron cada misión.</p>
      </div>
      <div className="teachers__grid">
        {TEACHERS.map((t) => (
          <TiltCard key={t.id} teacher={t} />
        ))}
      </div>
    </section>
  );
}

function TiltCard({ teacher }: { teacher: (typeof TEACHERS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 220, damping: 22 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      className="teacher-card"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, ["--accent" as string]: teacher.accent }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={springCard}
    >
      <div className="teacher-card__planet" aria-hidden>
        🍕
      </div>
      <SoftImage
        src={teacher.fotoSrc}
        alt={teacher.nombre}
        className="teacher-card__img"
        fallbackLabel={teacher.nombre}
        accent={teacher.accent}
      />
      <h3>{teacher.nombre}</h3>
      <p>{teacher.rol}</p>
    </motion.div>
  );
}
