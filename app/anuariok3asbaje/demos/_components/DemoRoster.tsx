"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { FactSceneGrid, SceneCanvas } from "./SceneCanvas";
import { scenesForStudent } from "../_lib/themeScenes";

export type DemoStudent = {
  id: string;
  slug: string;
  nombreCorto: string;
  nombreCompleto: string;
  genero: "f" | "m";
  accent: string;
  suenioDeGrande: string;
  comidaFavorita: string;
  colorFavorito: string;
  mejorAmigo: string;
  fraseFavorita: string;
  loQueMasLeGusto: string;
  avatarSrc: string | null;
  primerDiaSrc: string | null;
  diaFinalSrc: string | null;
  formularioEnviado?: boolean;
  dedicatoriaMama?: string;
  dedicatoriaPapa?: string;
};

const spring = { type: "spring" as const, stiffness: 340, damping: 30 };

export function DemoRoster({
  students,
  themeClass,
  title,
  subtitle,
}: {
  students: DemoStudent[];
  themeClass: string;
  title: string;
  subtitle: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DemoStudent | null>(null);
  const [focusScene, setFocusScene] = useState(0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.nombreCorto.toLowerCase().includes(q) ||
        s.nombreCompleto.toLowerCase().includes(q) ||
        s.suenioDeGrande.toLowerCase().includes(q)
    );
  }, [students, query]);

  const scenes = selected ? scenesForStudent(selected) : [];

  return (
    <div className={`demo-shell ${themeClass}`}>
      <header className="demo-hero">
        <p className="demo-eyebrow">Anuario K3 · Colegio Asbaje</p>
        <h1>{title}</h1>
        <p className="demo-sub">{subtitle}</p>
        <label className="demo-search">
          <Search size={16} strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar niño o sueño…"
            aria-label="Buscar"
          />
        </label>
      </header>

      <div className="demo-grid">
        {list.map((s, i) => (
          <motion.button
            key={s.id}
            type="button"
            className="demo-card"
            style={{ ["--accent" as string]: s.accent }}
            onClick={() => {
              setSelected(s);
              setFocusScene(0);
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: Math.min(i * 0.03, 0.3) }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="demo-card__photo">
              {s.avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatarSrc} alt={s.nombreCorto} />
              ) : (
                <div className="demo-card__placeholder">
                  <span>{s.nombreCorto.slice(0, 1)}</span>
                  <small>Foto pendiente</small>
                </div>
              )}
            </div>
            <div className="demo-card__meta">
              <strong>{s.nombreCorto}</strong>
              <span>{s.suenioDeGrande || "Sueño por completar"}</span>
            </div>
            <div className="demo-card__chips">
              {s.comidaFavorita ? <em>{s.comidaFavorita}</em> : null}
              {s.colorFavorito ? <em>{s.colorFavorito}</em> : null}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="demo-sheet-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="demo-sheet-bg" aria-label="Cerrar" onClick={() => setSelected(null)} />
            <motion.div
              className="demo-sheet"
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={spring}
            >
              <div className="demo-sheet__top">
                <div>
                  <p className="demo-eyebrow">Bitácora interactiva</p>
                  <h2>{selected.nombreCompleto || selected.nombreCorto}</h2>
                  <p className="demo-sub">
                    Toca cada escena: sueño, comida, color y más — visuales vivos, no stickers planos.
                  </p>
                </div>
                <motion.button
                  type="button"
                  className="demo-sheet__close"
                  onClick={() => setSelected(null)}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Cerrar"
                >
                  <X size={18} strokeWidth={1.75} />
                </motion.button>
              </div>

              <div className="demo-sheet__focus">
                <SceneCanvas scene={scenes[focusScene]} active />
              </div>

              <FactSceneGrid scenes={scenes} onSelect={(_s, i) => setFocusScene(i)} />

              {(selected.dedicatoriaMama || selected.dedicatoriaPapa) && (
                <div className="demo-dedicatorias">
                  {selected.dedicatoriaMama ? (
                    <blockquote>
                      <span>Mamá</span>
                      <p>{selected.dedicatoriaMama}</p>
                    </blockquote>
                  ) : null}
                  {selected.dedicatoriaPapa ? (
                    <blockquote>
                      <span>Papá</span>
                      <p>{selected.dedicatoriaPapa}</p>
                    </blockquote>
                  ) : null}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
