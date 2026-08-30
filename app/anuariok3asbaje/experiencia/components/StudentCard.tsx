"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { springCard, springLayout, springTap } from "./SoftImage";
import { SoftImage } from "./SoftImage";
import { GrowthSlider } from "./GrowthSlider";
import { FactSceneGrid, SceneCanvas } from "../../demos/_components/SceneCanvas";
import { scenesForStudent } from "../../demos/_lib/themeScenes";
import { LaminaStrip } from "./LaminaGallery";
import { laminasForSlug } from "../pdfManifest";
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
          {featured ? bitacoraTitulo(student) : student.suenioDeGrande || "Abrir bitácora"}
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
  const laminas = laminasForSlug(student.slug);

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
        </motion.div>
      </div>

      <div style={{ borderRadius: "1.1rem", overflow: "hidden", marginBottom: "0.75rem" }}>
        <SceneCanvas scene={scenes[focus]} active />
      </div>
      <FactSceneGrid scenes={scenes} onSelect={(_s, i) => setFocus(i)} />

      {laminas.length > 0 ? (
        <div style={{ marginTop: "1rem" }}>
          <LaminaStrip
            laminas={laminas}
            heading="Láminas del anuario"
            sub="Diseño Canva: bitácora, recuerdos y comando estelar"
          />
        </div>
      ) : null}

      {(student.dedicatoriaMama || student.dedicatoriaPapa) && (
        <div className="demo-dedicatorias" style={{ marginTop: "1rem" }}>
          {student.dedicatoriaMama ? (
            <blockquote>
              <span>Mamá (formulario)</span>
              <p>{student.dedicatoriaMama}</p>
            </blockquote>
          ) : null}
          {student.dedicatoriaPapa ? (
            <blockquote>
              <span>Papá (formulario)</span>
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
