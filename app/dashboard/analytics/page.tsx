'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  Globe, Monitor, Smartphone, Tablet, TrendingUp,
  Clock, Users, ArrowUp, ArrowDown, Minus, RefreshCw,
} from 'lucide-react';

type Range = 'today' | '7d' | 'month';

interface StatsData {
  hoy:          { visitas: number; topDemo: string | null; topPais: string | null };
  ayer:         { visitas: number };
  demos:        { demo: string; visitas: number; avgSegundos: number }[];
  paises:       { pais: string; visitas: number; pct: number }[];
  fuentes:      { fuente: string; visitas: number }[];
  dispositivos: { dispositivo: string; visitas: number }[];
  recientes:    { page: string; demo: string | null; pais: string; ciudad: string; dispositivo: string; navegador: string; createdAt: string }[];
}

const DEMO_COLORS: Record<string, string> = {
  barber: '#a78bfa', cobranza: '#60a5fa', dentista: '#34d399',
  grooming: '#fb923c', medico: '#f472b6', nutricion: '#facc15',
  restaurante: '#f87171', spa: '#818cf8', taller: '#4ade80',
};

const DEVICE_COLORS = ['#60a5fa', '#a78bfa', '#34d399'];

function fmtTime(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function DeltaBadge({ hoy, ayer }: { hoy: number; ayer: number }) {
  if (ayer === 0) return <span className="text-slate-500 text-xs">—</span>;
  const pct = Math.round(((hoy - ayer) / ayer) * 100);
  if (pct > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold"><ArrowUp size={12} />+{pct}% vs ayer</span>;
  if (pct < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold"><ArrowDown size={12} />{pct}% vs ayer</span>;
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus size={12} />igual que ayer</span>;
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {sub && <div>{sub}</div>}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [range, setRange] = useState<Range>('7d');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/stats?range=${range}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(`Error ${res.status}: ${body.error ?? 'respuesta inesperada'}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const rangeLabels: Record<Range, string> = { today: 'Hoy', '7d': '7 días', month: 'Este mes' };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Actualizado {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-white/5 border border-white/10 overflow-hidden text-sm">
            {(['today', '7d', 'month'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 transition-colors ${range === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 text-sm mb-6">
          Error al cargar stats: <strong>{error}</strong>
        </div>
      )}

      {loading && !data && !error && (
        <div className="flex items-center justify-center h-64 text-slate-500">Cargando datos…</div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Section 1: Hoy vs Ayer */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Hoy vs Ayer</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Visitas hoy"
                value={data.hoy.visitas}
                sub={<DeltaBadge hoy={data.hoy.visitas} ayer={data.ayer.visitas} />}
                icon={Users}
                color="bg-indigo-600"
              />
              <KpiCard
                label="Demo más visto hoy"
                value={data.hoy.topDemo ?? '—'}
                icon={TrendingUp}
                color="bg-violet-600"
              />
              <KpiCard
                label="País #1 hoy"
                value={data.hoy.topPais ?? '—'}
                icon={Globe}
                color="bg-sky-600"
              />
            </div>
          </section>

          {/* Section 2: Demo popularity */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Demos más populares</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {data.demos.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Sin datos para este período</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={data.demos.length * 48 + 20}>
                    <BarChart
                      data={data.demos}
                      layout="vertical"
                      margin={{ left: 16, right: 48, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="demo"
                        tick={{ fill: '#94a3b8', fontSize: 13 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{ background: '#1e1e2e', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 13 }}
                        formatter={(val: number, _n: string, item: { payload?: { avgSegundos?: number } }) => [
                          `${val} visitas — avg ${fmtTime(item.payload?.avgSegundos ?? 0)}`, '',
                        ]}
                      />
                      <Bar dataKey="visitas" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 12 }}>
                        {data.demos.map((entry) => (
                          <Cell key={entry.demo} fill={DEMO_COLORS[entry.demo] ?? '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                    {data.demos.map((d) => (
                      <div key={d.demo} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={11} className="text-slate-500" />
                        <span className="capitalize">{d.demo}</span>
                        <span className="text-slate-500">{fmtTime(d.avgSegundos)} prom.</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section 3+4: Countries + Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Países</h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {data.paises.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase">
                        <th className="text-left pb-3">País</th>
                        <th className="text-right pb-3">Visitas</th>
                        <th className="text-right pb-3">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.paises.map((p) => (
                        <tr key={p.pais}>
                          <td className="py-2 text-slate-300">{p.pais}</td>
                          <td className="py-2 text-right text-white font-medium">{p.visitas}</td>
                          <td className="py-2 text-right text-slate-400">{p.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Fuentes de tráfico</h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {data.fuentes.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase">
                        <th className="text-left pb-3">Fuente</th>
                        <th className="text-right pb-3">Visitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.fuentes.map((f) => (
                        <tr key={f.fuente}>
                          <td className="py-2 text-slate-300">{f.fuente}</td>
                          <td className="py-2 text-right text-white font-medium">{f.visitas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Section 5: Devices */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Dispositivos</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {data.dispositivos.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Sin datos</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={220} height={200}>
                    <PieChart>
                      <Pie
                        data={data.dispositivos}
                        dataKey="visitas"
                        nameKey="dispositivo"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {data.dispositivos.map((entry, i) => (
                          <Cell key={entry.dispositivo} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e1e2e', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 13 }}
                      />
                      <Legend formatter={(val) => <span className="text-slate-300 text-xs capitalize">{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-3">
                    {data.dispositivos.map((d, i) => {
                      const Icon = d.dispositivo === 'mobile' ? Smartphone : d.dispositivo === 'tablet' ? Tablet : Monitor;
                      return (
                        <div key={d.dispositivo} className="flex items-center gap-3">
                          <Icon size={16} style={{ color: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                          <span className="text-slate-300 capitalize text-sm w-16">{d.dispositivo}</span>
                          <span className="text-white font-bold text-sm">{d.visitas}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 6: Recent activity */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Actividad reciente</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {data.recientes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Sin eventos recientes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-slate-500 text-xs uppercase">
                        <th className="text-left px-4 py-3">Página</th>
                        <th className="text-left px-4 py-3">País / Ciudad</th>
                        <th className="text-left px-4 py-3">Dispositivo</th>
                        <th className="text-left px-4 py-3">Navegador</th>
                        <th className="text-right px-4 py-3">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.recientes.map((r, i) => (
                        <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{r.page}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">
                            {r.pais}{r.ciudad && r.ciudad !== r.pais ? ` · ${r.ciudad}` : ''}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs capitalize">{r.dispositivo}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{r.navegador}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 text-xs whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
