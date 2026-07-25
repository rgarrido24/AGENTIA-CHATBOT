"use client";

import { motion } from "framer-motion";
import { AudioVisualizer } from "./AudioVisualizer";
import { springCard } from "./SoftImage";
import { ASSETS, CARTA_TEXTO } from "../data";

export function StarCommandLetter() {
  return (
    <section className="section carta" id="carta">
      <div className="section__head">
        <p className="section__eyebrow">Comando Estelar</p>
        <h2 className="section__title">Querido Aventurero</h2>
      </div>

      <motion.article
        className="carta__card"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={springCard}
      >
        <div className="carta__ribbon" aria-hidden>
          <CassetteSpin />
        </div>
        <p className="carta__body">{CARTA_TEXTO}</p>
        <AudioVisualizer src={ASSETS.cartaAudio} label="Escuchar narración" bars={22} />
      </motion.article>
    </section>
  );
}

function CassetteSpin() {
  return (
    <motion.div
      className="cassette"
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      <span />
      <span />
    </motion.div>
  );
}
