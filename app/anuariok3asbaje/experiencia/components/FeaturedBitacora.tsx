"use client";

import { motion } from "framer-motion";
import { GrowthSlider } from "./GrowthSlider";
import { AudioVisualizer } from "./AudioVisualizer";
import { SoftImage, springCard, springTap } from "./SoftImage";
import { usePhotoStudio } from "./PhotoStudioContext";
import { FEATURED_SLUG, STUDENTS, bitacoraTitulo } from "../data";

export function FeaturedBitacora() {
  const student = STUDENTS.find((s) => s.slug === FEATURED_SLUG)!;
  const { resolve } = usePhotoStudio();

  const primer = resolve("amaia.primerDia", student.primerDiaSrc);
  const final = resolve("amaia.diaFinal", student.diaFinalSrc);
  const avatar = resolve("amaia.avatar", student.avatarSrc);

  return (
    <section className="section featured-bitacora" id="bitacora">
      <div className="section__head">
        <p className="eyebrow">Misión cumplida</p>
        <h2 className="section__title">{bitacoraTitulo(student)}</h2>
      </div>

      <motion.div
        className="mission-board"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={springCard}
      >
        <div className="mission-board__texture" aria-hidden />

        <div className="mission-board__grid">
          <div className="polaroid-stack">
            <span className="sheriff-star sheriff-star--tl" aria-hidden />
            <span className="tape" aria-hidden />
            <motion.div
              className="polaroid"
              whileHover={{ rotate: -1.5, y: -6 }}
              transition={springTap}
            >
              <GrowthSlider
                primerDiaSrc={primer}
                diaFinalSrc={final || avatar}
                alt={student.nombreCompleto}
                accent="#E8A0BF"
              />
            </motion.div>
            <h3 className="polaroid-name">{student.nombreCompleto.split(" ").slice(0, 2).join(" ")}</h3>
            <span className="sheriff-star sheriff-star--br" aria-hidden />
          </div>

          <ul className="fact-list">
            {student.badges.map((b, i) => (
              <motion.li
                key={b.label}
                className="fact-row"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.15, delay: i * 0.04 }}
                whileHover={{ x: 4 }}
              >
                <span className="fact-row__icon" aria-hidden>
                  {b.icon}
                </span>
                <div>
                  <p className="fact-row__label">{b.label}</p>
                  <p className="fact-row__value">{b.value}</p>
                  {"audioSrc" in b ? (
                    <AudioVisualizer src={b.audioSrc} label="Escuchar voz" bars={10} />
                  ) : null}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mission-board__avatar-hint">
          <SoftImage
            src={avatar}
            alt="Avatar Amaia"
            className="mission-board__mini"
            fallbackLabel="Avatar"
            accent="#E8A0BF"
          />
          <p>Usa “Subir fotos” para reemplazar Primer día / Día final / Avatar.</p>
        </div>
      </motion.div>
    </section>
  );
}
