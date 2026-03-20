'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, MessageCircle, X } from 'lucide-react';
import {
  MOCK_ALUMNOS,
  type Alumno,
  type Carrera,
  type Ciclo,
  type StatusAlumno,
  telefonoWaDigits,
} from '@/lib/mock-data-cobranza';
import { plantillaMensaje } from '@/lib/cobranza-messages';
import { generarEstadoCuentaPdf } from '@/lib/cobranza-pdf';
import {
  barColorScore,
  factoresRiesgo,
  labelScore,
  recomendacionIA,
} from '@/lib/cobranza-risk';

const ASESORES = ['Todos', 'María González', 'Jorge Ramírez', 'Sofía Castro', 'Luis Herrera'] as const;
const CICLOS: Array<'Todos' | Ciclo> = ['Todos', 'Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Ciclo 4'];
const STATUSES: Array<'Todos' | StatusAlumno> = [
  'Todos',
  'al_corriente',
  'adeudo',
  'riesgo',
  'baja_riesgo',
];
const CARRERAS: Array<'Todos' | Carrera> = [
  'Todos',
  'Preparatoria',
  'Ingeniería',
  'Administración',
  'Diseño',
];

function statusBadge(s: StatusAlumno) {
  const map: Record<StatusAlumno, { label: string; className: string }> = {
    al_corriente: { label: 'Al corriente', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    adeudo: { label: 'Adeudo', className: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
    riesgo: { label: 'Riesgo', className: 'bg-orange-500/20 text-orange-200 border-orange-500/40' },
    baja_riesgo: { label: 'Baja riesgo', className: 'bg-red-500/20 text-red-300 border-red-500/40' },
  };
  const m = map[s];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${m.className}`}>{m.label}</span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = barColorScore(score);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8 tabular-nums">{score}</span>
    </div>
  );
}

function CobranzaTablaInner() {
  const searchParams = useSearchParams();
  const [asesor, setAsesor] = useState<string>('Todos');
  const [ciclo, setCiclo] = useState<string>('Todos');
  const [status, setStatus] = useState<string>('Todos');
  const [carrera, setCarrera] = useState<string>('Todos');
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState<Alumno | null>(null);
  const [tab, setTab] = useState<'msg' | 'pdf' | 'score'>('msg');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;
    const decoded = decodeURIComponent(id);
    const a = MOCK_ALUMNOS.find((x) => x.id === decoded);
    if (a) {
      setAsesor('Todos');
      setCiclo('Todos');
      setStatus('Todos');
      setCarrera('Todos');
      setQ('');
      setDrawer(a);
      setTab('msg');
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return MOCK_ALUMNOS.filter((a) => {
      if (asesor !== 'Todos' && a.asesor !== asesor) return false;
      if (ciclo !== 'Todos' && a.ciclo !== ciclo) return false;
      if (status !== 'Todos' && a.status !== status) return false;
      if (carrera !== 'Todos' && a.carrera !== carrera) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        return (
          a.nombre.toLowerCase().includes(t) ||
          a.tutor.toLowerCase().includes(t) ||
          a.id.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [asesor, ciclo, status, carrera, q]);

  const msg = drawer ? plantillaMensaje(drawer) : '';
  const waHref = drawer
    ? `https://wa.me/52${telefonoWaDigits(drawer.telefono)}?text=${encodeURIComponent(msg)}`
    : '#';

  async function copiar() {
    if (!msg) return;
    try {
      await navigator.clipboard.writeText(msg);
      setToast(true);
      setTimeout(() => setToast(false), 2200);
    } catch {
      setToast(true);
      setTimeout(() => setToast(false), 2200);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm shadow-lg"
          >
            ¡Copiado al portapapeles!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Asesor
          <select
            value={asesor}
            onChange={(e) => setAsesor(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white min-w-[160px]"
          >
            {ASESORES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Ciclo
          <select
            value={ciclo}
            onChange={(e) => setCiclo(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white min-w-[120px]"
          >
            {CICLOS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white min-w-[140px]"
          >
            {STATUSES.map((x) => (
              <option key={x} value={x}>
                {x === 'Todos' ? 'Todos' : x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Carrera
          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white min-w-[140px]"
          >
            {CARRERAS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 flex-1 min-w-[200px]">
          Buscar
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, tutor o folio..."
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white w-full"
          />
        </label>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-3 font-medium">Alumno</th>
                <th className="px-3 py-3 font-medium">Carrera</th>
                <th className="px-3 py-3 font-medium">Ciclo</th>
                <th className="px-3 py-3 font-medium">Adeudo</th>
                <th className="px-3 py-3 font-medium">Score</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-white font-medium">{a.nombre}</td>
                  <td className="px-3 py-2.5 text-slate-400">{a.carrera}</td>
                  <td className="px-3 py-2.5 text-slate-300">{a.ciclo}</td>
                  <td className="px-3 py-2.5 text-amber-300 tabular-nums">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
                      a.montoAdeudo
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar score={a.scoreRiesgo} />
                  </td>
                  <td className="px-3 py-2.5">{statusBadge(a.status)}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawer(a);
                        setTab('msg');
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-blue-700 transition"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setDrawer(null)}
              aria-label="Cerrar"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#0f172a] border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <p className="text-xs text-slate-500">Gestión</p>
                  <p className="font-semibold text-white">{drawer.nombre}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawer(null)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-white/10 px-2">
                {(
                  [
                    ['msg', 'Mensajes'],
                    ['pdf', 'Estado PDF'],
                    ['score', 'Score'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                      tab === k
                        ? 'border-[#1e40af] text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {tab === 'msg' && (
                  <div className="space-y-4">
                    <textarea
                      readOnly
                      className="w-full min-h-[200px] bg-slate-900/80 border border-white/10 rounded-lg p-3 text-sm text-slate-200 leading-relaxed"
                      value={msg}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copiar}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar mensaje
                      </button>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Abrir WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {tab === 'pdf' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      Genera un PDF con datos del alumno y desglose del adeudo (demo).
                    </p>
                    <button
                      type="button"
                      onClick={() => void generarEstadoCuentaPdf(drawer)}
                      className="w-full py-3 rounded-xl font-semibold bg-[#1e40af] hover:bg-blue-800 transition"
                    >
                      Generar Estado de Cuenta PDF
                    </button>
                  </div>
                )}

                {tab === 'score' && (
                  <div className="space-y-4">
                    {(() => {
                      const sc = drawer.scoreRiesgo;
                      const lb = labelScore(sc);
                      return (
                        <>
                          <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03] text-center">
                            <p className={`text-5xl font-bold tabular-nums ${lb.color}`}>{sc}</p>
                            <p className={`text-sm font-semibold mt-1 ${lb.color}`}>{lb.label}</p>
                            <div className="mt-4 h-3 rounded-full bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full ${barColorScore(sc)}`}
                                style={{ width: `${Math.min(100, sc)}%` }}
                              />
                            </div>
                          </div>
                          <ul className="space-y-2 text-sm">
                            {factoresRiesgo(drawer).map((f, i) => (
                              <li
                                key={i}
                                className="flex justify-between border-b border-white/5 pb-2 text-slate-300"
                              >
                                <span>{f.label}</span>
                                <span className={f.puntos >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {f.puntos >= 0 ? '+' : ''}
                                  {f.puntos} pts
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-slate-200">
                            💡 <strong>Recomendación IA:</strong> {recomendacionIA(sc)}
                          </div>
                          <Link
                            href={`/demo/cobranza/asistente?alumno=${encodeURIComponent(drawer.nombre)}&score=${drawer.scoreRiesgo}&ciclo=${encodeURIComponent(drawer.ciclo)}`}
                            className="block w-full text-center py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 transition"
                          >
                            Consultar al Asistente IA
                          </Link>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CobranzaTablaPage() {
  return (
    <Suspense
      fallback={<div className="text-slate-500 text-sm max-w-7xl mx-auto py-8">Cargando cobranza…</div>}
    >
      <CobranzaTablaInner />
    </Suspense>
  );
}
