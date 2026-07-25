"use client";

import { LaminaStrip } from "./LaminaGallery";
import { laminasShared } from "../pdfManifest";

/** Láminas compartidas del PDF (portada, carta, maestras, grupales, cierre). */
export function SharedLaminasSection() {
  const laminas = laminasShared();
  return (
    <section className="section" id="laminas">
      <div className="section__head">
        <p className="eyebrow">Plantilla Canva · 55 páginas</p>
        <h2 className="section__title">Álbum de la misión</h2>
        <p className="section__sub">
          Láminas diseñadas del PDF integradas al anuario interactivo. Toca para ampliar;
          las de cada niño viven dentro de su bitácora.
        </p>
      </div>
      <LaminaStrip
        laminas={laminas}
        heading="Secciones del salón"
        sub="Portada, carta, guardianas, misión y cierre"
      />
    </section>
  );
}
