"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FactSceneGrid, SceneCanvas } from "../../demos/_components/SceneCanvas";
import { scenesForStudent } from "../../demos/_lib/themeScenes";
import { GrowthSlider } from "./GrowthSlider";
import { springCard } from "./SoftImage";
import { usePhotoStudio } from "./PhotoStudioContext";
import { FEATURED_SLUG, STUDENTS, bitacoraTitulo } from "../data";

export function FeaturedBitacora() {
  const student = STUDENTS.find((s) => s.slug === FEATURED_SLUG)!;
  const { resolve } = usePhotoStudio();
  const [focus, setFocus] = useState(0);

  const primer = resolve("amaia.primerDia", student.primerDiaSrc);
  const final = resolve("amaia.diaFinal", student.diaFinalSrc);

  const scenes = useMemo(
    () =>
      scenesForStudent({
        suenioDeGrande: student.badges[0]?.value,
        comidaFavorita: student.badges[1]?.value,
        colorFavorito: student.badges[2]?.value,
        mejorAmigo: student.badges[3]?.value,
        fraseFavorita: student.badges[4]?.value,
        loQueMasLeGusto: student.badges[5]?.value,
      }),
    [student]
  );

  return (
    <section className="section featured-bitacora" id="bitacora">
      <div className="section__head">
        <p className="eyebrow">Misión cumplida</p>
        <h2 className="section__title">{bitacoraTitulo(student)}</h2>
        <p className="section__sub">
          Escenas interactivas: toca sueño, comida, color… y cambia el universo visual.
        </p>
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
            <motion.div className="polaroid" whileHover={{ rotate: -1.5, y: -6 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <GrowthSlider
                primerDiaSrc={primer}
                diaFinalSrc={final}
                alt={student.nombreCompleto}
                accent="#E8A0BF"
              />
            </motion.div>
            <h3 className="polaroid-name">
              {student.nombreCompleto.split(" ").slice(0, 2).join(" ")}
            </h3>
            <span className="sheriff-star sheriff-star--br" aria-hidden />
          </div>

          <div>
            <div style={{ borderRadius: "1.1rem", overflow: "hidden", marginBottom: "0.75rem" }}>
              <SceneCanvas scene={scenes[focus]} active />
            </div>
            <FactSceneGrid scenes={scenes} onSelect={(_s, i) => setFocus(i)} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
