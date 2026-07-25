"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  accent?: string;
};

/** Imagen con fallback ilustrado si el archivo aún no existe (carga manual). */
export function SoftImage({ src, alt, className = "", fallbackLabel, accent = "#7B5294" }: Props) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        className={`soft-image-fallback ${className}`}
        style={{
          background: `linear-gradient(145deg, ${accent}55, #F4EBE1 55%, ${accent}33)`,
        }}
        role="img"
        aria-label={alt}
      >
        <span className="soft-image-fallback__badge">📸</span>
        <span className="soft-image-fallback__label">{fallbackLabel || "Foto pendiente"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export const springTap = { type: "spring" as const, stiffness: 400, damping: 25 };
export const springCard = { type: "spring" as const, stiffness: 300, damping: 30 };
export const springLayout = { type: "spring" as const, stiffness: 350, damping: 35 };

export function TactileButton({
  children,
  className = "",
  onClick,
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={springTap}
    >
      {children}
    </motion.button>
  );
}
