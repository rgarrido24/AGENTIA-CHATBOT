"use client";

import { motion } from "framer-motion";
import { AudioVisualizer } from "./AudioVisualizer";
import { springCard } from "./SoftImage";
import { ASSETS, CARTA_TEXTO } from "../data";

export function StarCommandLetter() {
  return (
    <section className="section carta" id="carta">
      <div className="section__head">
        <p className="eyebrow">Comando Estelar</p>
        <h2 className="section__title">Querido Aventurero</h2>
      </div>

      <div className="carta__scene">
        <div className="carta__sky" aria-hidden />
        <div className="carta__deck" aria-hidden>
          <span className="deck-pill deck-pill--blue" />
          <span className="deck-pill deck-pill--green" />
          <span className="deck-pill deck-pill--red" />
          <span className="deck-screen" />
          <span className="deck-knob" />
        </div>

        <motion.article
          className="stamp-card"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={springCard}
        >
          <div className="stamp-card__edge" aria-hidden />
          <p className="stamp-card__lead">Al infinito y más allá</p>
          <p className="stamp-card__body">{CARTA_TEXTO}</p>
          <div className="stamp-card__audio">
            <AudioVisualizer src={ASSETS.cartaAudio} label="Escuchar narración" bars={20} />
          </div>
        </motion.article>
      </div>
    </section>
  );
}
