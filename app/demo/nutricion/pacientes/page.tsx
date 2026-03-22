'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, XAxis } from 'recharts';
import {
  MOCK_PACIENTES,
  type Paciente,
  progresoMetaPct,
  semanasTratamiento,
  sparklinePeso4Semanas,
  ultimaMedicion,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';

type Filtro = 'todos' | 'activos' | 'riesgo' | 'objetivo_logrado' | 'pausados';

function barClass(pct: number) {
  if (pct < 25) return 'bg-slate-500';
  if (pct < 50) return 'bg-sky-500';
  if (pct < 75) return 'bg-emerald-400/90';
  return 'bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.65)]';
}

function PacientesInner() {
  const { mediciones, dietas } = useNutricion();
  const sp = useSearchParams();
  const initialFiltro = (sp.get('filtro') === 'riesgo' ? 'riesgo' : 'todos') as Filtro;
  const [filtro, setFiltro] = useState<Filtro>(initialFiltro);
  const [drawer, setDrawer] = useState<Paciente | null>(null);

  const list = useMemo(() => {
    return MOCK_PACIENTES.filter((p) => {
      if (filtro === 'activos') return p.status === 'activo';
      if (filtro === 'pausados') return p.status === 'pausado';
      if (filtro === 'objetivo_logrado') return p.status === 'objetivo_logrado';
      if (filtro === 'riesgo') return p.status === 'activo' && p.diasSinRegistro > 7;
      return true;
    });
  }, [filtro]);

  const dietaDe = (pid: string) => dietas.find((d) => d.pacienteId === pid);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['activos', 'Activos'],
            ['riesgo', 'En riesgo'],
            ['objetivo_logrado', 'Objetivo logrado'],
            ['pausados', 'Pausados'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFiltro(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              filtro === k
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'border-white/15 text-slate-400 hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((p) => {
          const ult = ultimaMedicion(p.id, mediciones);
          const primera = mediciones
            .filter((m) => m.pacienteId === p.id)
            .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
          const pct = progresoMetaPct(p, mediciones);
          const spark = sparklinePeso4Semanas(p.id, mediciones);
          const data = spark.map((s) => ({ w: s.semana, peso: s.peso }));
          return (
            <motion.div
              key={p.id}
              layout
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-white flex items-center gap-2">
                    <span>👤</span> {p.nombre}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      p.status === 'activo'
                        ? 'bg-emerald-500/25 text-emerald-200'
                        : p.status === 'pausado'
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-violet-500/20 text-violet-200'
                    }`}
                  >
                    {p.status === 'activo' ? 'Activa' : p.status === 'pausado' ? 'Pausada' : 'Objetivo'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">Objetivo: {p.objetivo}</p>
              <p className="text-xs text-slate-500">
                📅 Semana {semanasTratamiento(p)} de tratamiento
              </p>
              <p className="text-sm text-slate-200">
                ⚖️ Inicio: {primera?.peso ?? '—'}kg → Hoy: {ult?.peso ?? '—'}kg
              </p>
              <p className="text-xs text-slate-400">
                📉 {primera && ult ? `${(ult.peso - primera.peso).toFixed(1)}kg` : '—'} | 🎯 Meta: {p.pesoMetaKg}kg
              </p>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barClass(pct)}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">{pct}% hacia su meta</p>
              <p className="text-xs text-slate-500">Último registro: hace {p.diasSinRegistro} días</p>
              {p.diasSinRegistro > 7 && p.status === 'activo' && (
                <motion.p
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-red-400 font-semibold"
                >
                  ⚠️ {p.diasSinRegistro} días sin registrar
                </motion.p>
              )}
              <div className="h-[48px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.length ? data : [{ w: '—', peso: ult?.peso ?? 0 }]}>
                    <XAxis dataKey="w" hide />
                    <Line type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                <Link
                  href={`/demo/nutricion/tablero?paciente=${p.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-200 border border-emerald-500/25"
                >
                  Ver tablero
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const tel = p.telefono.replace(/\D/g, '');
                    const msg = encodeURIComponent(
                      `¡Hola ${p.nombre.split(' ')[0]}! 💚 Un pequeño paso cuenta. ¿Cómo te sientes esta semana? — ${p.nutriologa}`
                    );
                    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:bg-white/5"
                >
                  Enviar motivación
                </button>
                <button
                  type="button"
                  onClick={() => setDrawer(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-200"
                >
                  Ver detalle
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

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
              transition={{ type: 'spring', damping: 28 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-[#0a1a12] shadow-2xl overflow-y-auto p-6"
            >
              <h3 className="text-lg font-bold text-white mb-2">{drawer.nombre}</h3>
              <p className="text-xs text-slate-500 mb-4">{drawer.email}</p>
              <p className="text-sm text-slate-300 mb-2">
                <strong>Motivación:</strong> {drawer.motivacion}
              </p>
              <p className="text-xs text-slate-500 mb-4">Objetivo: {drawer.objetivo}</p>
              <div className="h-[120px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sparklinePeso4Semanas(drawer.id, mediciones).map((s) => ({ w: s.semana, peso: s.peso }))}
                  >
                    <Line type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-emerald-400 mb-1">Dieta actual</p>
                <p className="text-xs text-slate-400 mb-1">{dietaDe(drawer.id)?.nombre ?? '—'}</p>
                <p className="text-[10px] text-slate-500 line-clamp-4">{dietaDe(drawer.id)?.contenido}</p>
              </div>
              <p className="text-xs font-semibold text-white mb-2">Últimas 3 mediciones</p>
              <ul className="text-xs text-slate-400 space-y-1 mb-6">
                {mediciones
                  .filter((m) => m.pacienteId === drawer.id)
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .slice(0, 3)
                  .map((m) => (
                    <li key={m.id}>
                      {m.fecha}: {m.peso}kg · grasa {m.grasaCorporal}% · GV {m.grasaVisceral}
                    </li>
                  ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/demo/nutricion/tablero?paciente=${drawer.id}`}
                  className="text-center py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                >
                  Ver tablero completo
                </Link>
                <Link
                  href={`/demo/nutricion/inbody?paciente=${drawer.id}`}
                  className="text-center py-2 rounded-lg border border-white/15 text-sm"
                >
                  Registrar InBody
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const tel = drawer.telefono.replace(/\D/g, '');
                    window.open(`https://wa.me/${tel}?text=${encodeURIComponent('Hola 👋')}`, '_blank');
                  }}
                  className="py-2 rounded-lg border border-emerald-500/40 text-emerald-200 text-sm"
                >
                  Enviar mensaje WA
                </button>
                <Link
                  href={`/demo/nutricion/dietas?paciente=${drawer.id}`}
                  className="text-center py-2 rounded-lg border border-amber-500/30 text-amber-200 text-sm"
                >
                  Cambiar dieta
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PacientesPage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
      <PacientesInner />
    </Suspense>
  );
}
