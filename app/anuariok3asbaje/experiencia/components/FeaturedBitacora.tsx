"use client";

import { motion } from "framer-motion";
import { GrowthSlider } from "./GrowthSlider";
import { AudioVisualizer } from "./AudioVisualizer";
import { springCard } from "./SoftImage";
import { FEATURED_SLUG, STUDENTS, bitacoraTitulo } from "../data";

export function FeaturedBitacora() {
  const student = STUDENTS.find((s) => s.slug === FEATURED_SLUG)!;

  return (
    <section className="section featured-bitacora" id="bitacora">
      <div className="section__head">
        <p className="section__eyebrow">{bitacoraTitulo(student)}</p>
        <h2 className="section__title">{student.nombreCompleto}</h2>
        <p className="section__sub">
          Plantilla lista: sustituye las fotos en{" "}
          <code>/public/anuario-k3/alumnos/{student.slug}/</code>
        </p>
      </div>

      <motion.div
        className="bitacora bitacora--desktop"
        style={{ margin: "0 auto", ["--accent" as string]: student.accent }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={springCard}
      >
        <div className="bitacora__top">
          <div className="bitacora__photo-wrap">
            <GrowthSlider
              primerDiaSrc={student.primerDiaSrc}
              diaFinalSrc={student.diaFinalSrc}
              alt={student.nombreCompleto}
              accent={student.accent}
            />
          </div>
          <div>
            <p className="bitacora__eyebrow">Insignias de Sheriff</p>
            <h3 className="bitacora__name">Su misión personal</h3>
            <p style={{ margin: "0.75rem 0 0", opacity: 0.75, fontWeight: 600 }}>
              Pasa el cursor o mantén la foto para ver Primer Día ↔ Día Final.
            </p>
          </div>
        </div>

        <ul className="bitacora__badges">
          {student.badges.map((b) => (
            <li key={b.label} className="badge-sheriff">
              <span className="badge-sheriff__icon" aria-hidden>
                {b.icon}
              </span>
              <div>
                <p className="badge-sheriff__label">{b.label}</p>
                <p className="badge-sheriff__value">{b.value}</p>
                {"audioSrc" in b ? (
                  <AudioVisualizer src={b.audioSrc} label="Voz del niño" bars={12} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
