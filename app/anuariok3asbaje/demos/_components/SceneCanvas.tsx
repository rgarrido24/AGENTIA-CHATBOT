"use client";

import { motion } from "framer-motion";
import type { SceneSpec } from "../_lib/themeScenes";

const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

export function SceneCanvas({ scene, active = false }: { scene: SceneSpec; active?: boolean }) {
  return (
    <motion.div
      className="scene-canvas"
      style={{ background: scene.gradient }}
      animate={active ? { scale: 1.02 } : { scale: 1 }}
      transition={spring}
    >
      <div className="scene-canvas__wash" aria-hidden />
      {scene.shapes.map((shape, i) => (
        <span key={`${shape}-${i}`} className={`scene-shape scene-shape--${shape}`} aria-hidden />
      ))}
      <Motif motif={scene.motif} />
      <div className="scene-canvas__copy">
        <p>{scene.label}</p>
        <strong>{scene.title}</strong>
        <span>{scene.subtitle}</span>
      </div>
    </motion.div>
  );
}

function Motif({ motif }: { motif: string }) {
  return (
    <div className={`scene-motif scene-motif--${motif}`} aria-hidden>
      {motif === "truck" && (
        <>
          <i className="truck-body" />
          <i className="truck-cab" />
          <i className="truck-wheel truck-wheel--l" />
          <i className="truck-wheel truck-wheel--r" />
          <i className="truck-light" />
        </>
      )}
      {motif === "rocket" && (
        <>
          <i className="rocket-body" />
          <i className="rocket-fin rocket-fin--l" />
          <i className="rocket-fin rocket-fin--r" />
          <i className="rocket-flame" />
        </>
      )}
      {motif === "hotdog" && (
        <>
          <i className="dog-bun" />
          <i className="dog-sausage" />
          <i className="dog-mustard" />
        </>
      )}
      {motif === "pizza" && <i className="pizza-pie" />}
      {motif === "swatch" && (
        <>
          <i className="swatch-a" />
          <i className="swatch-b" />
          <i className="swatch-c" />
        </>
      )}
      {motif === "voice" && (
        <>
          <i className="voice-bar" />
          <i className="voice-bar" />
          <i className="voice-bar" />
          <i className="voice-bar" />
          <i className="voice-bar" />
        </>
      )}
      {motif === "duo" && (
        <>
          <i className="duo-a" />
          <i className="duo-b" />
        </>
      )}
      {(motif === "star" || motif === "balloon" || motif === "care" || motif === "chalk" || motif === "plate" || motif === "taco" || motif === "ice") && (
        <i className="motif-orb" />
      )}
    </div>
  );
}

export function FactSceneGrid({
  scenes,
  onSelect,
}: {
  scenes: SceneSpec[];
  onSelect?: (scene: SceneSpec, index: number) => void;
}) {
  return (
    <div className="fact-scene-grid">
      {scenes.map((scene, i) => (
        <motion.button
          key={`${scene.kind}-${i}`}
          type="button"
          className="fact-scene-card"
          onClick={() => onSelect?.(scene, i)}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SceneCanvas scene={scene} />
        </motion.button>
      ))}
    </div>
  );
}
