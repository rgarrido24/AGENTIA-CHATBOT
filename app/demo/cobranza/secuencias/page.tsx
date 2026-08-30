'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, MessageCircle } from 'lucide-react';
import { colaHoy, telefonoWaDigits } from '@/lib/mock-data-cobranza';
import { plantillaMensaje, previewSecuencia } from '@/lib/cobranza-messages';

function ArrowConnector() {
  return (
    <div className="px-1 text-[#1e40af] flex items-center shrink-0" aria-hidden>
      <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 12h16M18 8l4 4-4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const PASOS = [
  {
    dia: 0,
    nombre: 'Vencimiento',
    canal: 'wa' as const,
    auto: true,
    idx: 0 as const,
  },
  {
    dia: 7,
    nombre: 'Recordatorio WA',
    canal: 'wa' as const,
    auto: true,
    idx: 1 as const,
  },
  {
    dia: 15,
    nombre: '2.º aviso WA',
    canal: 'wa' as const,
    auto: true,
    idx: 2 as const,
  },
  {
    dia: 30,
    nombre: 'Aviso final WA + PDF',
    canal: 'mix' as const,
    auto: false,
    idx: 3 as const,
  },
];

export default function SecuenciasPage() {
  const cola = colaHoy();
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ alumnoId: string; mensaje: string; wa: string } | null>(null);

  const rows = useMemo(
    () =>
      cola.map((a) => ({
        alumno: a,
        mensaje: plantillaMensaje(a),
        wa: `https://wa.me/52${telefonoWaDigits(a.telefono)}?text=${encodeURIComponent(plantillaMensaje(a))}`,
      })),
    [cola]
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* A — Flujo visual */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Flujo de secuencia</h2>
        <div className="hidden lg:flex flex-row items-stretch justify-between gap-2">
          {PASOS.map((p, i) => (
            <div key={p.dia} className="flex items-center flex-1 min-w-0">
              <motion.div
                whileHover={{ y: -4 }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-4 relative group"
              >
                <p className="text-3xl font-bold text-[#1e40af] tabular-nums leading-tight">
                  Día {p.dia}
                </p>
                <p className="text-sm font-medium text-white mt-1">{p.nombre}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.canal === 'mix' ? (
                    <>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        WhatsApp
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-200 border border-blue-500/40">
                        PDF
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      p.auto
                        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                        : 'bg-slate-600/40 text-slate-300 border-slate-500/40'
                    }`}
                  >
                    {p.auto ? 'Automático' : 'Manual'}
                  </span>
                </div>
                <p
                  className="mt-3 text-[11px] text-slate-500 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={previewSecuencia(p.idx)}
                >
                  {previewSecuencia(p.idx)}
                </p>
              </motion.div>
              {i < PASOS.length - 1 && <ArrowConnector />}
            </div>
          ))}
        </div>

        {/* Mobile vertical */}
        <div className="lg:hidden space-y-4 pl-4 border-l-2 border-[#1e40af]/40">
          {PASOS.map((p) => (
            <motion.div
              key={p.dia}
              whileHover={{ x: 4 }}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-2xl font-bold text-[#1e40af]">Día {p.dia}</p>
              <p className="text-sm font-medium text-white">{p.nombre}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {p.canal === 'mix' ? (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <FileText className="w-4 h-4 text-blue-400" />
                  </>
                ) : (
                  <span className="text-xs text-emerald-400">WhatsApp</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">{previewSecuencia(p.idx)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* B — Cola de hoy */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Acciones pendientes para hoy</h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">{cola.length}</span>
        </div>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-3 font-medium">Alumno</th>
                <th className="px-3 py-3 font-medium">Ciclo</th>
                <th className="px-3 py-3 font-medium">Mensaje a enviar</th>
                <th className="px-3 py-3 font-medium">Asesor</th>
                <th className="px-3 py-3 font-medium">Ejecutar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ alumno, mensaje, wa }) => (
                <tr key={alumno.id} className="border-b border-white/5">
                  <td className="px-3 py-2.5 text-white font-medium">{alumno.nombre}</td>
                  <td className="px-3 py-2.5 text-slate-400">{alumno.ciclo}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[200px] truncate" title={mensaje}>
                    {mensaje.slice(0, 80)}…
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{alumno.asesor}</td>
                  <td className="px-3 py-2.5">
                    {sent[alumno.id] ? (
                      <span className="text-emerald-400 text-xs">✅ Enviado</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModal({ alumnoId: alumno.id, mensaje, wa })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-blue-800"
                      >
                        Ejecutar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {modal && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70"
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,480px)] rounded-xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl"
            >
              <h3 className="font-semibold text-white mb-2">Vista previa</h3>
              <textarea
                readOnly
                className="w-full min-h-[160px] bg-slate-900/80 border border-white/10 rounded-lg p-3 text-sm text-slate-200 mb-4"
                value={modal.mensaje}
              />
              <div className="flex flex-wrap gap-2">
                <a
                  href={modal.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setSent((s) => ({ ...s, [modal.alumnoId]: true }));
                    setModal(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                >
                  Abrir en WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* C — Métricas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tasa de respuesta 1.er contacto', value: '34%' },
          { label: 'Reducción de morosidad con secuencias', value: '-28%' },
          { label: 'Días promedio de recuperación', value: '12' },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-2">{m.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
