'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCliente,
  getVehiculo,
  MOCK_ORDENES,
  type FotoOrden,
  type StatusOrden,
} from '@/lib/mock-data-taller';

const STATUS_STEPS: { status: StatusOrden; label: string }[] = [
  { status: 'recibido',     label: 'Recibido' },
  { status: 'diagnostico',  label: 'Diagnóstico' },
  { status: 'en_reparacion',label: 'Reparación' },
  { status: 'listo',        label: 'Listo ✓' },
  { status: 'entregado',    label: 'Entregado' },
];

const STATUS_IDX: Record<StatusOrden, number> = {
  recibido: 0,
  diagnostico: 1,
  en_reparacion: 2,
  listo: 3,
  entregado: 4,
};

const TIPO_FOTO_LABEL: Record<FotoOrden['tipo'], string> = {
  recepcion: '📸 Recepción',
  avance: '🔧 Avance',
  entrega: '✅ Entrega',
};

const WA_TALLER = 'https://wa.me/529998080265?text=' + encodeURIComponent('Hola, quiero saber el estado de mi vehículo.');

// Tomamos la primera orden con checklist como demo representativa
const ORDEN_DEMO = MOCK_ORDENES.find((o) => o.checklist) ?? MOCK_ORDENES[0]!;

export default function SeguimientoPage() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [toast, setToast] = useState('');

  const orden = ORDEN_DEMO;
  const v = getVehiculo(orden.vehiculoId);
  const c = getCliente(orden.clienteId);

  const stepIdx = STATUS_IDX[orden.status];
  const fotosVisibles = orden.fotosOrden.filter((f) => f.visibleCliente);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-4 py-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-700 mb-3">
          <span className="text-2xl">🔧</span>
        </div>
        <h1 className="text-lg font-bold">AutoPro Taller Mecánico</h1>
        <p className="text-sm text-slate-400 mt-0.5">Tu vehículo está en buenas manos 🔧</p>
        <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-600/30 text-amber-300 border border-amber-700">
          VISTA DEL CLIENTE — DEMO
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* Card del vehículo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="flex items-start gap-3">
            <span className="text-4xl">{v?.emoji ?? '🚗'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">
                {v ? `${v.marca} ${v.modelo} ${v.año}` : 'Vehículo'}
              </p>
              <p className="text-sm text-slate-400">Placa: {v?.placa ?? '—'} · {v?.color}</p>
              <p className="text-xs text-slate-500 mt-1">
                Técnico: <span className="text-slate-300">{orden.tecnico}</span>
              </p>
              <p className="text-xs text-slate-500">
                Ingresó: <span className="text-slate-300">{orden.fechaIngreso}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Orden</p>
              <p className="text-sm font-bold text-sky-400">{orden.id.toUpperCase()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Cliente: <span className="text-white">{c?.nombre ?? '—'}</span>
          </p>
        </motion.div>

        {/* Barra de progreso */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Estado del servicio</p>
          <div className="relative">
            {/* Línea base */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-white/10" />
            {/* Línea progreso */}
            <div
              className="absolute top-3 left-0 h-0.5 bg-emerald-500 transition-all duration-700"
              style={{ width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            {/* Puntos */}
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((s, i) => {
                const done = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={s.status} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                        active
                          ? 'border-emerald-400 bg-emerald-900 text-emerald-300'
                          : done
                          ? 'border-emerald-500 bg-emerald-800 text-emerald-200'
                          : 'border-white/20 bg-white/5 text-slate-600'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <p
                      className={`text-[10px] text-center leading-tight w-14 ${
                        active ? 'text-emerald-300 font-semibold' : done ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Estimado de entrega */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`rounded-2xl border p-4 ${
            orden.status === 'listo'
              ? 'border-emerald-700/50 bg-emerald-950/30'
              : 'border-white/10 bg-white/[0.04]'
          }`}
        >
          {orden.status === 'listo' ? (
            <p className="text-emerald-300 font-semibold text-sm">
              🎉 ¡Tu vehículo está listo! Puedes pasar a recogerlo hoy antes de las 6pm.
            </p>
          ) : orden.status === 'entregado' ? (
            <p className="text-slate-300 text-sm">✅ Tu vehículo fue entregado. ¡Gracias por confiar en AutoPro!</p>
          ) : (
            <p className="text-slate-300 text-sm">
              📅 Entrega estimada:{' '}
              <span className="font-semibold text-white">
                {new Date(orden.fechaEstimadaEntrega + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </span>
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Total del servicio: <span className="text-white font-medium">{fmt(orden.total)}</span>
          </p>
        </motion.div>

        {/* Fotos visibles para el cliente */}
        {fotosVisibles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase">Fotos de tu vehículo</p>
            <div className="grid grid-cols-2 gap-2">
              {fotosVisibles.map((f) => (
                <div key={f.id} className="rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.descripcion} className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-slate-300">{TIPO_FOTO_LABEL[f.tipo]}</p>
                    <p className="text-[11px] text-slate-500">{f.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mensaje del taller / autorización */}
        {orden.observaciones && orden.observaciones !== 'Cliente autorizado — trabajo en proceso.' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-amber-300 uppercase">Mensaje del taller</p>
            <p className="text-sm text-slate-200 leading-relaxed">
              💬 El técnico dice: <span className="text-white">{orden.observaciones}</span>
            </p>
            <AnimatePresence mode="wait">
              {autorizado === null ? (
                <motion.div
                  key="buttons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2"
                >
                  <button
                    type="button"
                    onClick={() => { setAutorizado(true); showToast('✓ Autorización enviada al taller'); }}
                    className="flex-1 py-2 rounded-xl font-semibold text-white bg-emerald-700 hover:bg-emerald-600 text-sm transition-colors"
                  >
                    ✓ Autorizo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAutorizado(false); showToast('Respuesta enviada al taller'); }}
                    className="flex-1 py-2 rounded-xl font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                  >
                    ✗ No por ahora
                  </button>
                </motion.div>
              ) : (
                <motion.p
                  key="confirmed"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-semibold ${autorizado ? 'text-emerald-300' : 'text-slate-400'}`}
                >
                  {autorizado ? '✓ Autorizaste el trabajo adicional' : '✗ Respondiste que no por ahora'}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Botón WhatsApp */}
        <motion.a
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          href={WA_TALLER}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-white bg-emerald-700 hover:bg-emerald-600 transition-colors text-sm"
        >
          💬 Escribir al taller por WhatsApp
        </motion.a>

        <p className="text-center text-xs text-slate-600 pb-4">
          AutoPro Taller Mecánico · Tel. 999-000-2222
        </p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
