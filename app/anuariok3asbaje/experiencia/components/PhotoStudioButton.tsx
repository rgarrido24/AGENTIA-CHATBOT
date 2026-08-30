"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X, Upload } from "lucide-react";
import { springCard, springTap } from "./SoftImage";
import { usePhotoStudio, type PhotoSlot } from "./PhotoStudioContext";
import { useStudents } from "./StudentsContext";
import type { Student } from "../data";

export function PhotoStudioButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"global" | "alumnos">("alumnos");
  const { slots, labels, photos, setPhoto, clearPhoto } = usePhotoStudio();
  const { students, setStudents } = useStudents();

  const applyFormPhoto = (studentId: string, field: "avatarSrc" | "primerDiaSrc" | "diaFinalSrc", url: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, [field]: url } : s))
    );
  };

  const uploadStudentPhoto = (
    studentId: string,
    field: "avatarSrc" | "primerDiaSrc" | "diaFinalSrc",
    file: File
  ) => {
    const url = URL.createObjectURL(file);
    applyFormPhoto(studentId, field, url);
  };

  const reapplyAllFormPhotos = (s: Student) => {
    if (!s.formFotos.length) return;
    setStudents((prev) =>
      prev.map((row) =>
        row.id !== s.id
          ? row
          : {
              ...row,
              avatarSrc: row.formFotos[0] || row.avatarSrc,
              primerDiaSrc: row.formFotos[1] || row.formFotos[0] || row.primerDiaSrc,
              diaFinalSrc: row.formFotos[2] || row.formFotos[0] || row.diaFinalSrc,
            }
      )
    );
  };

  return (
    <>
      <motion.button
        type="button"
        className="photo-island"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        transition={springTap}
        aria-label="Subir o migrar fotos"
      >
        <span className="photo-island__icon">
          <ImagePlus size={16} strokeWidth={1.75} />
        </span>
        <span>Subir / migrar fotos</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <div className="photo-panel-root" role="dialog" aria-modal="true" aria-label="Estudio de fotos">
            <motion.button
              type="button"
              className="photo-panel__backdrop"
              aria-label="Cerrar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="photo-panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={springCard}
            >
              <div className="photo-panel__head">
                <div>
                  <p className="photo-panel__eyebrow">Estudio de fotos</p>
                  <h3>Migrar formulario o subir nuevas</h3>
                  <p className="photo-panel__hint">
                    Las fotos del formulario (Cloudinary) ya se usan por defecto. Aquí puedes
                    reasignarlas o reemplazarlas. Para dejarlas fijas en disco:{" "}
                    <code>public/anuario-k3/alumnos/…</code>
                  </p>
                </div>
                <motion.button
                  type="button"
                  className="photo-panel__close"
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.96 }}
                  transition={springTap}
                  aria-label="Cerrar"
                >
                  <X size={18} strokeWidth={1.75} />
                </motion.button>
              </div>

              <div className="muro__filters" style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className={tab === "alumnos" ? "is-active" : ""}
                  onClick={() => setTab("alumnos")}
                >
                  Alumnos / formulario
                </button>
                <button
                  type="button"
                  className={tab === "global" ? "is-active" : ""}
                  onClick={() => setTab("global")}
                >
                  Portada y maestras
                </button>
              </div>

              {tab === "global" ? (
                <ul className="photo-panel__list">
                  {slots.map((slot) => (
                    <GlobalSlot
                      key={slot}
                      slot={slot}
                      label={labels[slot]}
                      preview={photos[slot]}
                      onPick={(file) => setPhoto(slot, file)}
                      onClear={() => clearPhoto(slot)}
                    />
                  ))}
                </ul>
              ) : (
                <ul className="photo-panel__list">
                  {students.map((s) => (
                    <li key={s.id} className="photo-slot" style={{ gridTemplateColumns: "1fr", gap: "0.65rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800 }}>{s.nombreCorto}</p>
                          <code style={{ fontSize: "0.68rem", opacity: 0.55 }}>
                            {s.formFotos.length} foto(s) en formulario
                          </code>
                        </div>
                        {s.formFotos.length > 0 ? (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => reapplyAllFormPhotos(s)}
                            style={{
                              border: 0,
                              borderRadius: 999,
                              padding: "0.35rem 0.7rem",
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              background: "#2aa4df",
                              color: "#fff",
                            }}
                          >
                            Usar fotos del form
                          </motion.button>
                        ) : null}
                      </div>

                      {s.formFotos.length > 0 ? (
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          {s.formFotos.map((url, idx) => (
                            <div key={`${s.id}-f-${idx}`} style={{ textAlign: "center" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt=""
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "cover",
                                  borderRadius: 10,
                                  display: "block",
                                }}
                              />
                              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                                <TinyBtn onClick={() => applyFormPhoto(s.id, "avatarSrc", url)}>Avatar</TinyBtn>
                                <TinyBtn onClick={() => applyFormPhoto(s.id, "primerDiaSrc", url)}>1er día</TinyBtn>
                                <TinyBtn onClick={() => applyFormPhoto(s.id, "diaFinalSrc", url)}>Final</TinyBtn>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.65, fontWeight: 600 }}>
                          Sin fotos en el formulario — súbelas abajo.
                        </p>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem" }}>
                        <FileField
                          label="Avatar"
                          onFile={(f) => uploadStudentPhoto(s.id, "avatarSrc", f)}
                        />
                        <FileField
                          label="Primer día"
                          onFile={(f) => uploadStudentPhoto(s.id, "primerDiaSrc", f)}
                        />
                        <FileField
                          label="Día final"
                          onFile={(f) => uploadStudentPhoto(s.id, "diaFinalSrc", f)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function TinyBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        borderRadius: 6,
        padding: "2px 4px",
        fontSize: 9,
        fontWeight: 800,
        cursor: "pointer",
        background: "rgba(42,164,223,0.15)",
        color: "#1c2430",
      }}
    >
      {children}
    </button>
  );
}

function FileField({ label, onFile }: { label: string; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => ref.current?.click()}
        style={{
          width: "100%",
          border: "1px dashed rgba(0,0,0,0.15)",
          borderRadius: 10,
          padding: "0.45rem",
          fontSize: "0.7rem",
          fontWeight: 800,
          cursor: "pointer",
          background: "#fff",
        }}
      >
        + {label}
      </motion.button>
    </div>
  );
}

function GlobalSlot({
  slot,
  label,
  preview,
  onPick,
  onClear,
}: {
  slot: PhotoSlot;
  label: string;
  preview?: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <li className="photo-slot">
      <div className="photo-slot__preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span>
            <Upload size={16} strokeWidth={1.75} />
          </span>
        )}
      </div>
      <div className="photo-slot__meta">
        <p>{label}</p>
        <code>{slot}</code>
      </div>
      <div className="photo-slot__actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = "";
          }}
        />
        <motion.button type="button" onClick={() => inputRef.current?.click()} whileTap={{ scale: 0.97 }}>
          Elegir
        </motion.button>
        {preview ? (
          <motion.button type="button" className="is-ghost" onClick={onClear} whileTap={{ scale: 0.97 }}>
            Quitar
          </motion.button>
        ) : null}
      </div>
    </li>
  );
}
