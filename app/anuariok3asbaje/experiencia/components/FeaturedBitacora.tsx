"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FactSceneGrid, SceneCanvas } from "../../demos/_components/SceneCanvas";
import { scenesForStudent } from "../../demos/_lib/themeScenes";
import { GrowthSlider } from "./GrowthSlider";
import { springCard } from "./SoftImage";
import { useStudents } from "./StudentsContext";
import { LaminaStrip } from "./LaminaGallery";
import { laminasForSlug } from "../pdfManifest";
import { bitacoraTitulo } from "../data";
import "../../demos/demos.css";

export function FeaturedBitacora() {
  const { featured, setStudents } = useStudents();
  const [focus, setFocus] = useState(0);

  const student = featured;
  const scenes = useMemo(() => (student ? scenesForStudent(student) : []), [student]);
  const laminas = student ? laminasForSlug(student.slug) : [];

  if (!student) {
    return (
      <section className="section" id="bitacora">
        <p className="section__sub" style={{ textAlign: "center" }}>
          Aún no hay alumnos cargados desde el formulario.
        </p>
      </section>
    );
  }

  return (
    <section className="section featured-bitacora" id="bitacora">
      <div className="section__head">
        <p className="eyebrow">Misión cumplida</p>
        <h2 className="section__title">{bitacoraTitulo(student)}</h2>
        <p className="section__sub">
          {student.nombreCompleto} — datos del formulario. Toca las escenas (sueño, comida,
          color…) para ver el universo visual.
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
            <motion.div
              className="polaroid"
              whileHover={{ rotate: -1.5, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <GrowthSlider
                primerDiaSrc={student.primerDiaSrc}
                diaFinalSrc={student.diaFinalSrc}
                alt={student.nombreCompleto}
                accent={student.accent}
              />
            </motion.div>
            <h3 className="polaroid-name">
              {student.nombreCompleto.split(" ").slice(0, 2).join(" ")}
            </h3>
            <span className="sheriff-star sheriff-star--br" aria-hidden />
          </div>

          <div>
            <div style={{ borderRadius: "1.1rem", overflow: "hidden", marginBottom: "0.75rem" }}>
              {scenes[focus] ? <SceneCanvas scene={scenes[focus]} active /> : null}
            </div>
            <FactSceneGrid scenes={scenes} onSelect={(_s, i) => setFocus(i)} />
          </div>
        </div>

        {laminas.length > 0 ? (
          <div style={{ marginTop: "1.1rem", position: "relative", zIndex: 1 }}>
            <LaminaStrip
              laminas={laminas}
              heading="Láminas Canva de esta vaquerita"
              sub="Bitácora diseñada · Recuerdos · Mensaje de papás"
            />
          </div>
        ) : null}

        <div className="mission-board__avatar-hint" style={{ marginTop: "1rem" }}>
          <p>
            {student.formFotos.length > 0
              ? `${student.formFotos.length} foto(s) del formulario listas. Usa “Subir / migrar fotos” para reasignar.`
              : "Sin fotos del formulario — súbelas con el botón flotante."}
          </p>
          {student.formFotos.length > 0 ? (
            <motion.button
              type="button"
              style={{
                border: 0,
                borderRadius: 999,
                padding: "0.45rem 0.85rem",
                fontWeight: 800,
                cursor: "pointer",
                background: "#2aa4df",
                color: "#fff",
                flex: "none",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setStudents((prev) =>
                  prev.map((s) =>
                    s.id !== student.id
                      ? s
                      : {
                          ...s,
                          avatarSrc: s.formFotos[0] || s.avatarSrc,
                          primerDiaSrc: s.formFotos[1] || s.formFotos[0] || s.primerDiaSrc,
                          diaFinalSrc: s.formFotos[2] || s.formFotos[0] || s.diaFinalSrc,
                        }
                  )
                );
              }}
            >
              Reaplicar fotos del form
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
