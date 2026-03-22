'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MOCK_PACIENTES,
  logrosDePaciente,
  medicionesDePaciente,
  primeraMedicion,
  semanasTratamiento,
  ultimaMedicion,
  type MedicionInBody,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';

type TabM = 'peso' | 'grasa' | 'musculo' | 'visceral';

function metricVal(m: MedicionInBody, t: TabM): number {
  if (t === 'peso') return m.peso;
  if (t === 'grasa') return m.grasaCorporal;
  if (t === 'musculo') return m.masaMuscular;
  return m.grasaVisceral;
}

function Arrow({ good, up }: { good: boolean; up: boolean }) {
  const color = good ? 'text-emerald-400' : 'text-red-400';
  if (up) return <span className={color}>↑</span>;
  return <span className={color}>↓</span>;
}

function TableroInner() {
  const { mediciones } = useNutricion();
  const sp = useSearchParams();
  const initial = sp.get('paciente') ?? 'p01';
  const [pid, setPid] = useState<string>(initial);
  const [tab, setTab] = useState<TabM>('peso');

  useEffect(() => {
    setPid(initial);
  }, [initial]);

  const p = MOCK_PACIENTES.find((x) => x.id === pid) ?? MOCK_PACIENTES[0]!;
  const ms = medicionesDePaciente(p.id, mediciones);
  const prim = primeraMedicion(p.id, mediciones);
  const ult = ultimaMedicion(p.id, mediciones);
  const logros = logrosDePaciente(p.id, mediciones);

  const chartData = useMemo(() => {
    return ms.map((m, i) => ({
      fecha: m.fecha,
      label: `P${i + 1}`,
      v: metricVal(m, tab),
      meta: tab === 'peso' ? p.pesoMetaKg : tab === 'grasa' ? 22 : tab === 'musculo' ? p.pesoMetaKg * 0.48 : 6,
    }));
  }, [ms, tab, p]);

  const metaY = chartData[0]?.meta ?? 0;
  const goodTrend = tab === 'musculo' ? chartData[chartData.length - 1]!.v >= chartData[0]!.v : chartData[chartData.length - 1]!.v <= chartData[0]!.v;

  const shareText = useMemo(() => {
    if (!prim || !ult) return '';
    const dP = (ult.peso - prim.peso).toFixed(1);
    const dMus = (ult.masaMuscular - prim.masaMuscular).toFixed(1);
    return (
      `🌟 Mi progreso en NutriVida:\n` +
      `📉 Peso: ${prim.peso}kg → ${ult.peso}kg (${dP}kg)\n` +
      `💪 Músculo: ${prim.masaMuscular}kg → ${ult.masaMuscular}kg (${dMus}kg)\n` +
      `❤️ Grasa visceral: ${prim.grasaVisceral} → ${ult.grasaVisceral}\n` +
      `¡Gracias Dra. Andrea! 💚`
    );
  }, [prim, ult]);

  const diff = (prim: MedicionInBody, ult: MedicionInBody, key: keyof MedicionInBody) => {
    const a = Number(prim[key]);
    const b = Number(ult[key]);
    return b - a;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="text-sm text-slate-400 flex flex-col gap-1">
          <span>Paciente</span>
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-white text-sm"
          >
            {MOCK_PACIENTES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {prim && ult && (
        <>
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-transparent p-6">
            <p className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              💪 Tablero de {p.nombre.split(' ')[0]}
            </p>
            <p className="text-emerald-200/90 text-sm italic mb-2">&quot;{p.motivacion}&quot;</p>
            <p className="text-xs text-slate-500">
              Semana {semanasTratamiento(p)} · Con NutriVida desde{' '}
              {new Date(p.fechaInicio + 'T12:00:00').toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-amber-200 mt-4">
              🏆 LOGROS: -{(prim.peso - ult.peso).toFixed(1)}kg peso | -{(prim.grasaCorporal - ult.grasaCorporal).toFixed(1)}%
              grasa | +{(ult.masaMuscular - prim.masaMuscular).toFixed(1)}kg músculo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500 mb-4">
                {new Date(prim.fecha + 'T12:00:00').toLocaleDateString('es-MX')} — Primera medición
              </p>
              <ul className="text-sm space-y-2 text-slate-300">
                <li>Peso: {prim.peso} kg</li>
                <li>Grasa: {prim.grasaCorporal}%</li>
                <li>Músculo: {prim.masaMuscular} kg</li>
                <li>G. visceral: {prim.grasaVisceral}</li>
                <li>Edad met.: {prim.edadMetabolica}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
              <p className="text-xs text-emerald-400 mb-4">HOY</p>
              <ul className="text-sm space-y-2 text-slate-100">
                <li className="flex items-center gap-2">
                  Peso: {ult.peso} kg{' '}
                  <Arrow good={diff(prim, ult, 'peso') <= 0} up={diff(prim, ult, 'peso') > 0} />
                </li>
                <li className="flex items-center gap-2">
                  Grasa: {ult.grasaCorporal}%{' '}
                  <Arrow good={diff(prim, ult, 'grasaCorporal') <= 0} up={diff(prim, ult, 'grasaCorporal') > 0} />
                </li>
                <li className="flex items-center gap-2">
                  Músculo: {ult.masaMuscular} kg{' '}
                  <Arrow good={diff(prim, ult, 'masaMuscular') >= 0} up={diff(prim, ult, 'masaMuscular') > 0} />
                </li>
                <li className="flex items-center gap-2">
                  G. visceral: {ult.grasaVisceral}{' '}
                  <Arrow good={diff(prim, ult, 'grasaVisceral') <= 0} up={diff(prim, ult, 'grasaVisceral') > 0} />
                </li>
                <li className="flex items-center gap-2">
                  Edad met.: {ult.edadMetabolica}{' '}
                  <Arrow good={diff(prim, ult, 'edadMetabolica') <= 0} up={diff(prim, ult, 'edadMetabolica') > 0} />
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(
                [
                  ['peso', 'Peso'],
                  ['grasa', '% Grasa'],
                  ['musculo', 'Masa muscular'],
                  ['visceral', 'Grasa visceral'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    tab === k ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-white/15 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="h-[320px] rounded-xl border border-white/10 bg-white/[0.02] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nutriArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={goodTrend ? '#16a34a' : '#ef4444'} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={goodTrend ? '#16a34a' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                  <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
                    formatter={(v: number) => [v.toFixed(1), tab]}
                  />
                  <ReferenceLine y={metaY} stroke="#f59e0b" strokeDasharray="4 4" label="Meta" />
                  <Area type="monotone" dataKey="v" stroke="none" fill="url(#nutriArea)" />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={goodTrend ? '#16a34a' : '#ef4444'}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    isAnimationActive
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="6 6"
                    dot={false}
                  />
                  {chartData[0] && (
                    <ReferenceDot
                      x={chartData[0].fecha}
                      y={chartData[0].v}
                      r={5}
                      fill="#22c55e"
                      stroke="#fff"
                      label="Inicio"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Timeline de logros</h3>
            <div className="relative border-l-2 border-emerald-600/40 ml-3 space-y-6 pl-6 py-2">
              {logros.map((l) => (
                <div key={l.id} className="relative">
                  <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a1a12]" />
                  <p className="text-sm text-slate-200">
                    {l.emoji} {new Date(l.fecha + 'T12:00:00').toLocaleDateString('es-MX')}: {l.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a]"
            >
              📱 Enviar tablero por WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function TableroPage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
      <TableroInner />
    </Suspense>
  );
}
