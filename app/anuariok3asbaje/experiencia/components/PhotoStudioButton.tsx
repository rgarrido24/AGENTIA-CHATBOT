"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X, Upload } from "lucide-react";
import { springCard, springTap } from "./SoftImage";
import { usePhotoStudio, type PhotoSlot } from "./PhotoStudioContext";

/** Island CTA + panel para cargar fotos reales por sección (preview local). */
export function PhotoStudioButton() {
  const [open, setOpen] = useState(false);
  const { slots, labels, photos, setPhoto, clearPhoto } = usePhotoStudio();

  return (
    <>
      <motion.button
        type="button"
        className="photo-island"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        transition={springTap}
        aria-label="Subir fotos del anuario"
      >
        <span className="photo-island__icon">
          <ImagePlus size={16} strokeWidth={1.75} />
        </span>
        <span>Subir fotos</span>
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
                  <h3>Carga manual por sección</h3>
                  <p className="photo-panel__hint">
                    Preview inmediato en el navegador. Para producción permanente, copia el
                    archivo a <code>public/anuario-k3/…</code> (ver README).
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

              <ul className="photo-panel__list">
                {slots.map((slot) => (
                  <SlotRow
                    key={slot}
                    slot={slot}
                    label={labels[slot]}
                    preview={photos[slot]}
                    onPick={(file) => setPhoto(slot, file)}
                    onClear={() => clearPhoto(slot)}
                  />
                ))}
              </ul>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SlotRow({
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
        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          whileTap={{ scale: 0.97 }}
          transition={springTap}
        >
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
