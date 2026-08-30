"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SoftImage, springCard } from "./SoftImage";
import { usePhotoStudio } from "./PhotoStudioContext";
import { TEACHERS } from "../data";

export function Teachers() {
  return (
    <section className="section teachers" id="maestras">
      <div className="section__head">
        <p className="eyebrow">Guardianas estelares</p>
        <h2 className="section__title">Miss Vale & Miss Paty</h2>
        <p className="section__sub">Quienes guiaron cada misión del salón.</p>
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
  const { resolve } = usePhotoStudio();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 220, damping: 24 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 220, damping: 24 });
  const slot = teacher.id === "vale" ? ("maestra.vale" as const) : ("maestra.paty" as const);
  const src = resolve(slot, teacher.fotoSrc);

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
      style={{
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 900,
        ["--accent" as string]: teacher.accent,
      }}
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
      <div className="bezel">
        <div className="bezel__inner">
          <SoftImage
            src={src}
            alt={teacher.nombre}
            className="teacher-card__img"
            fallbackLabel={teacher.nombre}
            accent={teacher.accent}
          />
        </div>
      </div>
      <h3>{teacher.nombre}</h3>
      <p>{teacher.rol}</p>
    </motion.div>
  );
}
