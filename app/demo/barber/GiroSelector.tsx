'use client';

import { motion } from 'framer-motion';
import type { GiroId } from './giro-config';

type Props = {
  onSelect: (giro: GiroId) => void;
};

const CARD_BARBER = {
  gradient: 'linear-gradient(135deg, #0a0f1a 0%, #0f1f1e 60%, #0d9488 100%)',
  acento: '#0d9488',
  acentoSoft: 'rgba(13, 148, 136, 0.3)',
  emoji: '✂️',
  titulo: 'Barbería',
  tagline: 'Cortes, barba y estilo masculino',
  servicios: ['Corte de cabello', 'Corte y barba', 'Paquete Gold', 'Delineado ceja'],
  textoBadge: 'Barberos: Sofia & Fernando',
};

const CARD_NAIL = {
  gradient: 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 50%, #f9a8d4 100%)',
  acento: '#ec4899',
  acentoSoft: 'rgba(236, 72, 153, 0.25)',
  emoji: '💅',
  titulo: 'Nail Studio',
  tagline: 'Uñas, nail art y cuidado',
  servicios: ['Uñas acrílicas', 'Uñas gel', 'Manicure', 'Nail art'],
  textoBadge: 'Nail artists: Sofia & Valeria',
};

export default function GiroSelector({ onSelect }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 100%)',
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
            Agentia Demo
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            ¿Qué tipo de negocio quieres ver?
          </h1>
          <p className="text-slate-400 text-base">
            Selecciona el giro y el asistente IA se adapta automáticamente
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Barbería */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('barberia')}
            className="relative rounded-3xl p-7 text-left overflow-hidden border-2 cursor-pointer"
            style={{
              background: CARD_BARBER.gradient,
              borderColor: CARD_BARBER.acento + '80',
              boxShadow: `0 0 48px ${CARD_BARBER.acentoSoft}, 0 2px 24px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-40"
              style={{ background: CARD_BARBER.acento }}
              aria-hidden
            />
            <div className="relative z-10">
              <div className="text-5xl mb-4">{CARD_BARBER.emoji}</div>
              <h2 className="text-2xl font-bold text-white mb-1">{CARD_BARBER.titulo}</h2>
              <p className="text-teal-300 text-sm mb-4">{CARD_BARBER.tagline}</p>
              <ul className="space-y-1.5 mb-5">
                {CARD_BARBER.servicios.map((s) => (
                  <li key={s} className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="text-teal-400 text-xs">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: CARD_BARBER.acentoSoft, color: '#5eead4', border: `1px solid ${CARD_BARBER.acento}55` }}
              >
                {CARD_BARBER.textoBadge}
              </span>
            </div>

            {/* CTA */}
            <div
              className="mt-6 w-full py-2.5 rounded-xl text-center text-sm font-bold text-white relative z-10"
              style={{ background: CARD_BARBER.acento }}
            >
              Probar Barbería →
            </div>
          </motion.button>

          {/* Nail Studio */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('nail')}
            className="relative rounded-3xl p-7 text-left overflow-hidden border-2 cursor-pointer"
            style={{
              background: CARD_NAIL.gradient,
              borderColor: CARD_NAIL.acento + '80',
              boxShadow: `0 0 48px ${CARD_NAIL.acentoSoft}, 0 2px 24px rgba(0,0,0,0.15)`,
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-30"
              style={{ background: CARD_NAIL.acento }}
              aria-hidden
            />
            <div className="relative z-10">
              <div className="text-5xl mb-4">{CARD_NAIL.emoji}</div>
              <h2 className="text-2xl font-bold text-pink-800 mb-1">{CARD_NAIL.titulo}</h2>
              <p className="text-pink-600 text-sm mb-4">{CARD_NAIL.tagline}</p>
              <ul className="space-y-1.5 mb-5">
                {CARD_NAIL.servicios.map((s) => (
                  <li key={s} className="text-pink-700 text-sm flex items-center gap-2">
                    <span className="text-pink-400 text-xs">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(236,72,153,0.12)', color: '#be185d', border: `1px solid ${CARD_NAIL.acento}55` }}
              >
                {CARD_NAIL.textoBadge}
              </span>
            </div>

            {/* CTA */}
            <div
              className="mt-6 w-full py-2.5 rounded-xl text-center text-sm font-bold text-white relative z-10"
              style={{ background: CARD_NAIL.acento }}
            >
              Probar Nail Studio →
            </div>
          </motion.button>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-slate-600 text-xs mt-8"
        >
          Puedes cambiar el giro en cualquier momento desde el menú lateral
        </motion.p>
      </div>
    </div>
  );
}
