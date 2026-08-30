"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Search } from "lucide-react";
import { StudentCard, StudentBitacora } from "./StudentCard";
import { VaulDrawer } from "./VaulDrawer";
import { SoftImage, springCard, springTap } from "./SoftImage";
import { usePhotoStudio } from "./PhotoStudioContext";
import { useStudents } from "./StudentsContext";
import { ASSETS, type Student } from "../data";

export function GenerationWall() {
  const { students, featured } = useStudents();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "f" | "m">("todos");
  const [selected, setSelected] = useState<Student | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { resolve } = usePhotoStudio();
  const grupal = resolve("generacion.grupal", ASSETS.fotoGrupal);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const list = useMemo(() => {
    return students.filter((s) => {
      if (featured && s.id === featured.id) return false;
      if (filter !== "todos" && s.genero !== filter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        s.nombreCorto.toLowerCase().includes(q) ||
        s.nombreCompleto.toLowerCase().includes(q) ||
        s.suenioDeGrande.toLowerCase().includes(q)
      );
    });
  }, [students, featured, query, filter]);

  return (
    <section className="section muro" id="generacion">
      <div className="section__head">
        <p className="eyebrow">Generación 2024-2026</p>
        <h2 className="section__title">Muro de la Tripulación</h2>
        <p className="section__sub">
          Datos del formulario en vivo. Toca una tarjeta para abrir la bitácora con escenas.
        </p>
      </div>

      {featured ? (
        <div className="muro__featured">
          <StudentCard student={featured} onSelect={setSelected} featured />
        </div>
      ) : null}

      <div className="muro__controls">
        <label className="muro__search">
          <Search size={16} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar compañero o sueño…"
            aria-label="Buscar compañero"
          />
        </label>
        <div className="muro__filters" role="group" aria-label="Filtros">
          {(
            [
              ["todos", "Todos"],
              ["f", "Vaqueritas"],
              ["m", "Vaqueros"],
            ] as const
          ).map(([id, label]) => (
            <motion.button
              key={id}
              type="button"
              className={filter === id ? "is-active" : ""}
              onClick={() => setFilter(id)}
              whileTap={{ scale: 0.96 }}
              transition={springTap}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <LayoutGroup>
        <motion.div className="muro__grid" layout>
          <AnimatePresence mode="popLayout">
            {list.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={springCard}
              >
                <StudentCard student={s} onSelect={setSelected} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!isMobile && selected ? (
            <motion.div
              className="bitacora-desktop-layer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="bitacora-desktop-layer__bg"
                aria-label="Cerrar"
                onClick={() => setSelected(null)}
              />
              <StudentBitacora student={selected} onClose={() => setSelected(null)} desktop />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>

      <VaulDrawer
        open={Boolean(isMobile && selected)}
        onClose={() => setSelected(null)}
        title={selected?.nombreCorto}
      >
        {selected ? (
          <StudentBitacora student={selected} onClose={() => setSelected(null)} />
        ) : null}
      </VaulDrawer>

      <div className="muro__group">
        <SoftImage
          src={grupal}
          alt="Foto grupal Generación 2024-2026"
          className="muro__group-img"
          fallbackLabel="Foto grupal pendiente"
          accent="#1E90D6"
        />
      </div>
    </section>
  );
}
