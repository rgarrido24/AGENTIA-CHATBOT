"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SoftImage, springCard, springLayout, springTap } from "./SoftImage";
import { GrowthSlider } from "./GrowthSlider";
import { FactSceneGrid, SceneCanvas } from "../../demos/_components/SceneCanvas";
import { scenesForStudent } from "../../demos/_lib/themeScenes";
import type { Student } from "../data";
import { bitacoraTitulo } from "../data";
import "../../demos/demos.css";

type Props = {
  student: Student;
  onSelect: (student: Student) => void;
  featured?: boolean;
};

export function StudentCard({ student, onSelect, featured }: Props) {
  return (
    <motion.button
      type="button"
      layoutId={`student-shell-${student.id}`}
      className={`student-card ${featured ? "student-card--featured" : ""}`}
      onClick={() => onSelect(student)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={springTap}
      style={{ ["--accent" as string]: student.accent }}
    >
      <motion.div
        className="student-card__photo"
        layoutId={`student-photo-${student.id}`}
        transition={springLayout}
      >
        <SoftImage
          src={student.avatarSrc}
          alt={student.nombreCompleto}
          className="student-card__img"
          fallbackLabel={student.nombreCorto}
          accent={student.accent}
        />
      </motion.div>
      <motion.div layoutId={`student-meta-${student.id}`} transition={springLayout}>
        <p className="student-card__name">{student.nombreCorto}</p>
        <p className="student-card__sub">
          {featured
            ? bitacoraTitulo(student)
            : student.suenioDeGrande || "Abrir bitácora"}
        </p>
      </motion.div>
    </motion.button>
  );
}

export function StudentBitacora({
  student,
  onClose,
  desktop,
}: {
  student: Student;
  onClose: () => void;
  desktop?: boolean;
}) {
  const [focus, setFocus] = useState(0);
  const scenes = scenesForStudent(student);

  return (
    <motion.div
      className={`bitacora ${desktop ? "bitacora--desktop" : ""}`}
      layoutId={`student-shell-${student.id}`}
      transition={springCard}
      style={{ ["--accent" as string]: student.accent }}
    >
      <div className="bitacora__top">
        <motion.div
          layoutId={`student-photo-${student.id}`}
          transition={springLayout}
          className="bitacora__photo-wrap"
        >
          <GrowthSlider
            primerDiaSrc={student.primerDiaSrc}
            diaFinalSrc={student.diaFinalSrc}
            alt={student.nombreCompleto}
            accent={student.accent}
          />
        </motion.div>
        <motion.div layoutId={`student-meta-${student.id}`} transition={springLayout}>
          <p className="bitacora__eyebrow">{bitacoraTitulo(student)}</p>
          <h3 className="bitacora__name">{student.nombreCompleto}</h3>
          {!student.formularioEnviado ? (
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", opacity: 0.65, fontWeight: 700 }}>
              Formulario pendiente — datos incompletos
            </p>
          ) : null}
        </motion.div>
      </div>

      <div style={{ borderRadius: "1.1rem", overflow: "hidden", marginBottom: "0.75rem" }}>
        <SceneCanvas scene={scenes[focus]} active />
      </div>
      <FactSceneGrid scenes={scenes} onSelect={(_s, i) => setFocus(i)} />

      {(student.dedicatoriaMama || student.dedicatoriaPapa) && (
        <div className="demo-dedicatorias" style={{ marginTop: "1rem" }}>
          {student.dedicatoriaMama ? (
            <blockquote>
              <span>Mamá</span>
              <p>{student.dedicatoriaMama}</p>
            </blockquote>
          ) : null}
          {student.dedicatoriaPapa ? (
            <blockquote>
              <span>Papá</span>
              <p>{student.dedicatoriaPapa}</p>
            </blockquote>
          ) : null}
        </div>
      )}

      {desktop ? (
        <motion.button
          type="button"
          className="bitacora__close"
          onClick={onClose}
          whileTap={{ scale: 0.96 }}
          transition={springTap}
        >
          Cerrar bitácora
        </motion.button>
      ) : null}
    </motion.div>
  );
}
