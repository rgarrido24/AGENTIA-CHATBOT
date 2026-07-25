"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { springCard, springTap } from "./SoftImage";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Bottom sheet estilo Vaul (Emil Kowalski) con spring physics. */
export function VaulDrawer({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="vaul-root" role="dialog" aria-modal="true" aria-label={title || "Detalle"}>
          <motion.button
            type="button"
            className="vaul-backdrop"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="vaul-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springCard}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="vaul-handle" aria-hidden />
            <div className="vaul-header">
              {title ? <h3>{title}</h3> : <span />}
              <motion.button
                type="button"
                className="vaul-close"
                onClick={onClose}
                whileTap={{ scale: 0.94 }}
                transition={springTap}
                aria-label="Cerrar ficha"
              >
                <X size={18} />
              </motion.button>
            </div>
            <div className="vaul-body">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
