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
import { useNutricionTheme } from '../nutricion-theme-context';

type Filtro = 'todos' | 'activos' | 'riesgo' | 'objetivo_logrado' | 'pausados';

function barClass(pct: number) {
  if (pct < 25) return 'bg-slate-400';
  if (pct < 50) return 'bg-sky-500';
  if (pct < 75) return 'bg-emerald-400';
  return 'bg-emerald-500';
}

function PacientesInner() {
  const { mediciones, dietas } = useNutricion();
  const { colors, theme } = useNutricionTheme();
  const isLight = theme === 'light';
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

  const statusBadge = (status: string) => {
    if (isLight) {
      if (status === 'activo') return { background: '#dcfce7', color: '#15803d' };
      if (status === 'pausado') return { background: '#fef3c7', color: '#b45309' };
      return { background: '#ede9fe', color: '#7c3aed' };
    }
    if (status === 'activo') return { background: 'rgba(34,197,94,0.2)', color: '#86efac' };
    if (status === 'pausado') return { background: 'rgba(245,158,11,0.2)', color: '#fcd34d' };
    return { background: 'rgba(167,139,250,0.2)', color: '#c4b5fd' };
  };

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
            className="px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={
              filtro === k
                ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff' }
                : { borderColor: colors.border, color: colors.textSecondary, background: 'transparent' }
            }
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
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <span>👤</span> {p.nombre}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={statusBadge(p.status)}>
                    {p.status === 'activo' ? 'Activa' : p.status === 'pausado' ? 'Pausada' : 'Objetivo'}
                  </span>
                </div>
              </div>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Objetivo: {p.objetivo}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                📅 Semana {semanasTratamiento(p)} de tratamiento
              </p>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                ⚖️ Inicio: {primera?.peso ?? '—'}kg → Hoy: {ult?.peso ?? '—'}kg
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                📉 {primera && ult ? `${(ult.peso - primera.peso).toFixed(1)}kg` : '—'} | 🎯 Meta: {p.pesoMetaKg}kg
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.border }}>
                <div className={`h-full rounded-full transition-all ${barClass(pct)}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px]" style={{ color: colors.textMuted }}>{pct}% hacia su meta</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Último registro: hace {p.diasSinRegistro} días</p>
              {p.diasSinRegistro > 7 && p.status === 'activo' && (
                <motion.p
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-red-500 font-semibold"
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
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: isLight ? '#dcfce7' : 'rgba(22,163,74,0.2)',
                    color: isLight ? '#15803d' : '#86efac',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(22,163,74,0.3)'}`,
                  }}
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
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                >
                  Enviar motivación
                </button>
                <button
                  type="button"
                  onClick={() => setDrawer(p)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    border: `1px solid ${isLight ? '#fcd34d' : 'rgba(245,158,11,0.3)'}`,
                    color: isLight ? '#b45309' : '#fcd34d',
                  }}
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
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md shadow-2xl overflow-y-auto p-6"
              style={{
                background: colors.sidebarBg,
                borderLeft: `1px solid ${colors.border}`,
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>{drawer.nombre}</h3>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>{drawer.email}</p>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                <strong>Motivación:</strong> {drawer.motivacion}
              </p>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>Objetivo: {drawer.objetivo}</p>
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
                <p className="text-xs font-semibold text-emerald-600 mb-1">Dieta actual</p>
                <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{dietaDe(drawer.id)?.nombre ?? '—'}</p>
                <p className="text-[10px] line-clamp-4" style={{ color: colors.textMuted }}>{dietaDe(drawer.id)?.contenido}</p>
              </div>
              <p className="text-xs font-semibold mb-2" style={{ color: colors.textPrimary }}>Últimas 3 mediciones</p>
              <ul className="text-xs space-y-1 mb-6" style={{ color: colors.textSecondary }}>
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
                  className="text-center py-2 rounded-lg text-sm"
                  style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                >
                  Registrar InBody
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const tel = drawer.telefono.replace(/\D/g, '');
                    window.open(`https://wa.me/${tel}?text=${encodeURIComponent('Hola 👋')}`, '_blank');
                  }}
                  className="py-2 rounded-lg text-sm"
                  style={{
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(22,163,74,0.4)'}`,
                    color: isLight ? '#15803d' : '#86efac',
                  }}
                >
                  Enviar mensaje WA
                </button>
                <Link
                  href={`/demo/nutricion/dietas?paciente=${drawer.id}`}
                  className="text-center py-2 rounded-lg text-sm"
                  style={{
                    border: `1px solid ${isLight ? '#fcd34d' : 'rgba(245,158,11,0.3)'}`,
                    color: isLight ? '#b45309' : '#fcd34d',
                  }}
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
    <Suspense fallback={<div className="text-center py-12" style={{ color: '#6b7280' }}>Cargando…</div>}>
      <PacientesInner />
    </Suspense>
  );
}
