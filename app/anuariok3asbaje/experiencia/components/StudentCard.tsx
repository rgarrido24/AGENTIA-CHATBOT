"use client";

import { motion } from "framer-motion";
import { SoftImage, springCard, springLayout, springTap } from "./SoftImage";
import { GrowthSlider } from "./GrowthSlider";
import { AudioVisualizer } from "./AudioVisualizer";
import type { Student } from "../data";
import { bitacoraTitulo } from "../data";

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
          {featured ? bitacoraTitulo(student) : "Abrir bitácora"}
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
